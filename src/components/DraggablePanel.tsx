import React from 'react';
import { Move, RotateCcw, Maximize2 } from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';

interface DraggablePanelProps {
  children: React.ReactNode;
  title: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  className?: string;
  accentColor?: string;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  children,
  title,
  initialPosition = { x: 20, y: 100 },
  initialSize = { width: 320, height: 400 },
  className = '',
  accentColor = 'purple'
}) => {
  const { dragProps, isDragging, resetPosition } = useDraggable(initialPosition);
  const { resizeProps, isResizing, resetSize, resizeHandles } = useResizable(initialSize);

  const getAccentColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      case 'pink': return 'bg-pink-500';
      default: return 'bg-purple-500';
    }
  };

  const combinedStyle = {
    ...dragProps.style,
    ...resizeProps.style,
    position: 'fixed' as const,
    left: dragProps.style.left,
    top: dragProps.style.top,
    width: resizeProps.style.width,
    height: resizeProps.style.height,
    cursor: isDragging ? 'grabbing' : isResizing ? 'auto' : 'auto',
    zIndex: isDragging || isResizing ? 1000 : 'auto',
    userSelect: 'none' as const
  };

  return (
    <div
      ref={dragProps.ref}
      style={combinedStyle}
      className={`bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl transition-all duration-200 ${
        isDragging || isResizing ? 'shadow-3xl scale-105 border-white/30' : ''
      } ${className}`}
    >
      {/* Draggable Header */}
      <div 
        onMouseDown={dragProps.onMouseDown}
        className="flex items-center justify-between p-4 border-b border-white/10 cursor-grab active:cursor-grabbing relative z-30"
      >
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 ${getAccentColor(accentColor)} rounded-full`}></div>
          <h3 className="text-white font-semibold">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetSize}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Reset size"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
          <button
            onClick={resetPosition}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Reset position"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <Move className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Panel Content */}
      <div className="p-4 overflow-auto relative z-0" style={{ height: 'calc(100% - 73px)' }}>
        {children}
      </div>

      {/* Resize Handles */}
      {resizeHandles.map((handle, index) => (
        <div
          key={index}
          className={handle.className}
          onMouseDown={handle.onMouseDown}
          style={{ pointerEvents: 'auto' }}
        />
      ))}

      {/* Corner resize indicators */}
      <div className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none z-30">
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/30 rounded-full"></div>
        <div className="absolute bottom-0.5 right-2 w-0.5 h-0.5 bg-white/20 rounded-full"></div>
        <div className="absolute bottom-2 right-0.5 w-0.5 h-0.5 bg-white/20 rounded-full"></div>
      </div>
    </div>
  );
};