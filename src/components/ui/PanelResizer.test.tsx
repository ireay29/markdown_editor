import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PanelResizer } from './PanelResizer';

describe('PanelResizer', () => {
  const mockOnResize = vi.fn();

  beforeEach(() => {
    mockOnResize.mockClear();
  });

  it('renders correctly', () => {
    render(
      <PanelResizer 
        direction="horizontal" 
        onResize={mockOnResize} 
      />
    );
    
    const resizer = screen.getByRole('separator');
    expect(resizer).toBeInTheDocument();
    expect(resizer).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('renders with vertical direction', () => {
    render(
      <PanelResizer 
        direction="vertical" 
        onResize={mockOnResize} 
      />
    );
    
    const resizer = screen.getByRole('separator');
    expect(resizer).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('applies custom className', () => {
    render(
      <PanelResizer 
        direction="horizontal" 
        onResize={mockOnResize} 
        className="custom-class"
      />
    );
    
    const resizer = screen.getByRole('separator');
    expect(resizer).toHaveClass('custom-class');
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <PanelResizer 
        direction="horizontal" 
        onResize={mockOnResize} 
        disabled={true}
      />
    );
    
    const resizer = screen.getByRole('separator');
    expect(resizer).toHaveAttribute('tabIndex', '-1');
    expect(resizer).toHaveClass('cursor-not-allowed', 'opacity-50');
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <PanelResizer 
        direction="horizontal" 
        onResize={mockOnResize} 
      />
    );
    
    const resizer = screen.getByRole('separator');
    await user.click(resizer);
    await user.keyboard('{ArrowRight}');
    
    expect(mockOnResize).toHaveBeenCalledWith(10);
  });

  it('handles keyboard navigation for vertical direction', async () => {
    const user = userEvent.setup();
    
    render(
      <PanelResizer 
        direction="vertical" 
        onResize={mockOnResize} 
      />
    );
    
    const resizer = screen.getByRole('separator');
    await user.click(resizer);
    await user.keyboard('{ArrowDown}');
    
    expect(mockOnResize).toHaveBeenCalledWith(10);
  });

  it('does not respond to keyboard when disabled', async () => {
    const user = userEvent.setup();
    
    render(
      <PanelResizer 
        direction="horizontal" 
        onResize={mockOnResize} 
        disabled={true}
      />
    );
    
    const resizer = screen.getByRole('separator');
    await user.click(resizer);
    await user.keyboard('{ArrowRight}');
    
    expect(mockOnResize).not.toHaveBeenCalled();
  });

  it('starts drag on mouse down', () => {
    render(
      <PanelResizer 
        direction="horizontal" 
        onResize={mockOnResize} 
      />
    );
    
    const resizer = screen.getByRole('separator');
    fireEvent.mouseDown(resizer, { clientX: 100 });
    
    expect(document.body.style.cursor).toBe('col-resize');
    expect(document.body.style.userSelect).toBe('none');
  });

  it('applies vertical cursor for vertical direction', () => {
    render(
      <PanelResizer 
        direction="vertical" 
        onResize={mockOnResize} 
      />
    );
    
    const resizer = screen.getByRole('separator');
    fireEvent.mouseDown(resizer, { clientY: 100 });
    
    expect(document.body.style.cursor).toBe('row-resize');
  });

  it('does not start drag when disabled', () => {
    render(
      <PanelResizer 
        direction="horizontal" 
        onResize={mockOnResize} 
        disabled={true}
      />
    );
    
    const resizer = screen.getByRole('separator');
    fireEvent.mouseDown(resizer, { clientX: 100 });
    
    expect(document.body.style.cursor).toBe('');
  });
});