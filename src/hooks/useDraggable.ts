import { useState, useRef, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DraggableState {
  isDragging: boolean;
  position: Position;
  dragOffset: Position;
}

export const useDraggable = (initialPosition: Position = { x: 0, y: 0 }) => {
  const [state, setState] = useState<DraggableState>({
    isDragging: false,
    position: initialPosition,
    dragOffset: { x: 0, y: 0 }
  });

  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    setState(prev => ({
      ...prev,
      isDragging: true,
      dragOffset
    }));

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!state.isDragging) return;

    const newPosition = {
      x: e.clientX - state.dragOffset.x,
      y: e.clientY - state.dragOffset.y
    };

    // Constrain to viewport bounds
    const maxX = window.innerWidth - (elementRef.current?.offsetWidth || 0);
    const maxY = window.innerHeight - (elementRef.current?.offsetHeight || 0);

    setState(prev => ({
      ...prev,
      position: {
        x: Math.max(0, Math.min(newPosition.x, maxX)),
        y: Math.max(0, Math.min(newPosition.y, maxY))
      }
    }));
  };

  const handleMouseUp = () => {
    setState(prev => ({
      ...prev,
      isDragging: false
    }));
  };

  useEffect(() => {
    if (state.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [state.isDragging, state.dragOffset]);

  const dragProps = {
    ref: elementRef,
    onMouseDown: handleMouseDown,
    style: {
      position: 'fixed' as const,
      left: state.position.x,
      top: state.position.y,
      cursor: state.isDragging ? 'grabbing' : 'grab',
      zIndex: state.isDragging ? 1000 : 'auto',
      userSelect: 'none' as const
    }
  };

  return {
    dragProps,
    isDragging: state.isDragging,
    position: state.position,
    resetPosition: () => setState(prev => ({ ...prev, position: initialPosition }))
  };
};