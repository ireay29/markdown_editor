import React, { useCallback, useEffect, useState } from 'react';

interface PanelResizerProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  className?: string;
  minSize?: number;
  maxSize?: number;
  disabled?: boolean;
}

export const PanelResizer: React.FC<PanelResizerProps> = ({
  direction,
  onResize,
  className = '',
  minSize,
  maxSize,
  disabled = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(true);
    setStartPos(direction === 'horizontal' ? e.clientX : e.clientY);
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction, disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPos - startPos;

    // Apply min/max constraints if provided
    let constrainedDelta = delta;
    if (minSize !== undefined && delta < -minSize) {
      constrainedDelta = -minSize;
    }
    if (maxSize !== undefined && delta > maxSize) {
      constrainedDelta = maxSize;
    }

    onResize(constrainedDelta);
    setStartPos(currentPos);
  }, [isDragging, direction, startPos, onResize, minSize, maxSize]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const baseClasses = direction === 'horizontal'
    ? 'w-1 cursor-col-resize bg-border hover:bg-primary/20 transition-colors'
    : 'h-1 cursor-row-resize bg-border hover:bg-primary/20 transition-colors';

  const activeClasses = isDragging ? 'bg-primary/40' : '';

  return (
    <div
      className={`${baseClasses} ${activeClasses} ${className} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (disabled) return;
        
        const step = 10;
        let delta = 0;
        
        if (direction === 'horizontal') {
          if (e.key === 'ArrowLeft') delta = -step;
          if (e.key === 'ArrowRight') delta = step;
        } else {
          if (e.key === 'ArrowUp') delta = -step;
          if (e.key === 'ArrowDown') delta = step;
        }
        
        if (delta !== 0) {
          e.preventDefault();
          onResize(delta);
        }
      }}
    />
  );
};