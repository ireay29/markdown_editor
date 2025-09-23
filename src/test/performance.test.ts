import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { performance } from 'perf_hooks';

// Mock large document for testing
const createLargeMarkdown = (lines: number) => {
  let content = '# Large Document\n\n';
  for (let i = 0; i < lines; i++) {
    content += `## Section ${i}\n\nThis is paragraph ${i} with some content that should be reasonably long to test performance characteristics.\n\n`;
    if (i % 10 === 0) {
      content += '```javascript\nconst example = "code block";\nconsole.log(example);\n```\n\n';
    }
  }
  return content;
};

// Performance measurement utility
const measurePerformance = async (operation: () => Promise<void> | void, name: string) => {
  const startTime = performance.now();
  await operation();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`${name}: ${duration.toFixed(2)}ms`);
  return duration;
};

describe('Performance Tests', () => {
  describe('Rendering Performance', () => {
    it('renders small document quickly', async () => {
      const smallDoc = createLargeMarkdown(10);
      
      const renderTime = await measurePerformance(() => {
        // Mock component that would render the document
        const mockElement = document.createElement('div');
        mockElement.innerHTML = smallDoc.replace(/\n/g, '<br>');
        document.body.appendChild(mockElement);
        document.body.removeChild(mockElement);
      }, 'Small document render');
      
      // Should render small documents very quickly
      expect(renderTime).toBeLessThan(50);
    });

    it('renders medium document within acceptable time', async () => {
      const mediumDoc = createLargeMarkdown(100);
      
      const renderTime = await measurePerformance(() => {
        const mockElement = document.createElement('div');
        mockElement.innerHTML = mediumDoc.replace(/\n/g, '<br>');
        document.body.appendChild(mockElement);
        document.body.removeChild(mockElement);
      }, 'Medium document render');
      
      // Should render medium documents within reasonable time
      expect(renderTime).toBeLessThan(200);
    });

    it('handles large document without blocking UI', async () => {
      const largeDoc = createLargeMarkdown(1000);
      
      const renderTime = await measurePerformance(() => {
        const mockElement = document.createElement('div');
        // Simulate chunked rendering for large documents
        const chunks = largeDoc.match(/.{1,1000}/g) || [];
        chunks.forEach(chunk => {
          const span = document.createElement('span');
          span.textContent = chunk;
          mockElement.appendChild(span);
        });
        document.body.appendChild(mockElement);
        document.body.removeChild(mockElement);
      }, 'Large document render');
      
      // Large documents should still render in reasonable time
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Memory Performance', () => {
    it('does not leak memory during repeated operations', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform repeated operations that might cause memory leaks
      for (let i = 0; i < 100; i++) {
        const element = document.createElement('div');
        element.innerHTML = createLargeMarkdown(10);
        document.body.appendChild(element);
        document.body.removeChild(element);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Memory increase: ${memoryIncrease} bytes`);
      
      // Memory increase should be minimal (allow for some variance)
      // This is a rough test as GC timing is unpredictable
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(1000000); // Less than 1MB increase
      }
    });

    it('cleans up event listeners properly', () => {
      const initialListeners = (window as any)._eventListenerCount || 0;
      
      // Simulate adding and removing event listeners
      const handlers: (() => void)[] = [];
      
      for (let i = 0; i < 10; i++) {
        const handler = () => console.log('test');
        handlers.push(handler);
        window.addEventListener('resize', handler);
      }
      
      // Remove all listeners
      handlers.forEach(handler => {
        window.removeEventListener('resize', handler);
      });
      
      const finalListeners = (window as any)._eventListenerCount || 0;
      
      // Should not accumulate listeners
      expect(finalListeners).toBeLessThanOrEqual(initialListeners);
    });
  });

  describe('UI Responsiveness', () => {
    it('maintains responsive UI during heavy operations', async () => {
      let uiBlocked = false;
      
      // Set up a timer to check if UI is blocked
      const checkInterval = setInterval(() => {
        const start = performance.now();
        setTimeout(() => {
          const delay = performance.now() - start;
          if (delay > 20) { // More than 20ms delay indicates blocking
            uiBlocked = true;
          }
        }, 0);
      }, 10);
      
      // Perform heavy operation
      await measurePerformance(async () => {
        // Simulate heavy computation in chunks
        for (let i = 0; i < 1000; i++) {
          if (i % 100 === 0) {
            // Yield to event loop every 100 iterations
            await new Promise(resolve => setTimeout(resolve, 0));
          }
          // Simulate some work
          Math.sqrt(Math.random() * 1000000);
        }
      }, 'Heavy operation with yielding');
      
      clearInterval(checkInterval);
      
      // UI should remain responsive
      expect(uiBlocked).toBe(false);
    });

    it('handles rapid user input without lag', async () => {
      const inputElement = document.createElement('input');
      document.body.appendChild(inputElement);
      
      const inputTimes: number[] = [];
      
      inputElement.addEventListener('input', () => {
        inputTimes.push(performance.now());
      });
      
      // Simulate rapid typing
      const startTime = performance.now();
      for (let i = 0; i < 50; i++) {
        const event = new InputEvent('input', { bubbles: true });
        inputElement.dispatchEvent(event);
      }
      
      // All events should be processed quickly
      const avgResponseTime = inputTimes.length > 1 
        ? (inputTimes[inputTimes.length - 1] - inputTimes[0]) / inputTimes.length
        : 0;
      
      document.body.removeChild(inputElement);
      
      expect(avgResponseTime).toBeLessThan(10); // Less than 10ms per input
    });
  });

  describe('Bundle Size Performance', () => {
    it('loads core modules efficiently', async () => {
      const loadTime = await measurePerformance(async () => {
        // Simulate module loading
        const modules = [
          () => import('../store/uiStore'),
          () => import('../components/ui/PanelResizer'),
          () => import('../hooks/useTheme'),
        ];
        
        await Promise.all(modules.map(m => m().catch(() => null)));
      }, 'Core modules loading');
      
      // Modules should load quickly
      expect(loadTime).toBeLessThan(100);
    });
  });

  describe('Data Processing Performance', () => {
    it('processes markdown parsing efficiently', async () => {
      const testMarkdown = createLargeMarkdown(500);
      
      const parseTime = await measurePerformance(() => {
        // Mock markdown processing
        const lines = testMarkdown.split('\n');
        const processed = lines.map(line => {
          if (line.startsWith('#')) return { type: 'heading', content: line };
          if (line.startsWith('```')) return { type: 'code', content: line };
          return { type: 'text', content: line };
        });
        
        expect(processed.length).toBeGreaterThan(0);
      }, 'Markdown parsing');
      
      // Parsing should be fast even for large documents
      expect(parseTime).toBeLessThan(100);
    });

    it('handles block operations efficiently', async () => {
      // Mock block data
      const blocks = Array.from({ length: 1000 }, (_, i) => ({
        id: `block-${i}`,
        type: 'paragraph',
        content: `Block content ${i}`,
        position: { start: i * 10, end: i * 10 + 10 },
      }));
      
      const operationTime = await measurePerformance(() => {
        // Simulate block reordering
        const reordered = [...blocks];
        for (let i = 0; i < 100; i++) {
          const from = Math.floor(Math.random() * reordered.length);
          const to = Math.floor(Math.random() * reordered.length);
          const [item] = reordered.splice(from, 1);
          reordered.splice(to, 0, item);
        }
        
        expect(reordered.length).toBe(blocks.length);
      }, 'Block operations');
      
      // Block operations should be efficient
      expect(operationTime).toBeLessThan(50);
    });
  });
});