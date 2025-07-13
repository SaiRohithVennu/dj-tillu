import { useState, useRef, useEffect } from 'react';

interface Size {
  width: number;
  height: number;
}

interface ResizableState {
  isResizing: boolean;
  size: Size;
  resizeDirection: string;
}

export const useResizable = (initialSize: Size = { width: 320, height: 400 }) => {
  const [state, setState] = useState<ResizableState>({
    isResizing: false,
    size: initialSize,
    resizeDirection: ''
  });

  const elementRef = useRef<HTMLDivElement>(null);
  const startSizeRef = useRef<Size>(initialSize);
  const startMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    if (!elementRef.current) return;

    startSizeRef.current = state.size;
    startMouseRef.current = { x: e.clientX, y: e.clientY };

    setState(prev => ({
      ...prev,
      isResizing: true,
      resizeDirection: direction
    }));

    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!state.isResizing) return;

    const deltaX = e.clientX - startMouseRef.current.x;
    const deltaY = e.clientY - startMouseRef.current.y;

    let newWidth = startSizeRef.current.width;
    let newHeight = startSizeRef.current.height;

    // Apply constraints
    const minWidth = 280;
    const minHeight = 200;
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - 40;

    switch (state.resizeDirection) {
      case 'right':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSizeRef.current.width + deltaX));
        break;
      case 'bottom':
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSizeRef.current.height + deltaY));
        break;
      case 'bottom-right':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSizeRef.current.width + deltaX));
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSizeRef.current.height + deltaY));
        break;
      case 'left':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSizeRef.current.width - deltaX));
        break;
      case 'top':
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSizeRef.current.height - deltaY));
        break;
      case 'top-left':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSizeRef.current.width - deltaX));
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSizeRef.current.height - deltaY));
        break;
      case 'top-right':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSizeRef.current.width + deltaX));
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSizeRef.current.height - deltaY));
        break;
      case 'bottom-left':
        newWidth = Math.max(minWidth, Math.min(maxWidth, startSizeRef.current.width - deltaX));
        newHeight = Math.max(minHeight, Math.min(maxHeight, startSizeRef.current.height + deltaY));
        break;
    }

    setState(prev => ({
      ...prev,
      size: { width: newWidth, height: newHeight }
    }));
  };

  const handleMouseUp = () => {
    setState(prev => ({
      ...prev,
      isResizing: false,
      resizeDirection: ''
    }));
  };

  useEffect(() => {
    if (state.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = getResizeCursor(state.resizeDirection);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [state.isResizing, state.resizeDirection, handleMouseMove, handleMouseUp]);

  const getResizeCursor = (direction: string) => {
    switch (direction) {
      case 'right':
      case 'left':
        return 'ew-resize';
      case 'top':
      case 'bottom':
        return 'ns-resize';
      case 'top-left':
      case 'bottom-right':
        return 'nw-resize';
      case 'top-right':
      case 'bottom-left':
        return 'ne-resize';
      default:
        return 'default';
    }
  };

  const resizeHandles = [
    { direction: 'right', className: 'absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-purple-500/50 transition-colors z-10' },
    { direction: 'bottom', className: 'absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-purple-500/50 transition-colors z-10' },
    { direction: 'bottom-right', className: 'absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize hover:bg-purple-500/70 transition-colors z-20' },
    { direction: 'left', className: 'absolute top-0 left-0 w-2 h-full cursor-ew-resize hover:bg-purple-500/50 transition-colors z-10' },
    { direction: 'top', className: 'absolute top-0 left-0 w-full h-2 cursor-ns-resize hover:bg-purple-500/50 transition-colors z-10' },
    { direction: 'top-left', className: 'absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-purple-500/70 transition-colors z-20' },
    { direction: 'top-right', className: 'absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-purple-500/70 transition-colors z-20' },
    { direction: 'bottom-left', className: 'absolute bottom-0 left-0 w-4 h-4 cursor-ne-resize hover:bg-purple-500/70 transition-colors z-20' }
  ];

  const resizeProps = {
    ref: elementRef,
    style: {
      width: state.size.width,
      height: state.size.height,
      minWidth: 280,
      minHeight: 200
    }
  };

  const resetSize = () => {
    setState(prev => ({
      ...prev,
      size: initialSize
    }));
  };

  return {
    resizeProps,
    isResizing: state.isResizing,
    size: state.size,
    resetSize,
    resizeHandles: resizeHandles.map(handle => ({
      ...handle,
      onMouseDown: (e: React.MouseEvent) => handleMouseDown(e, handle.direction)
    }))
  };
};