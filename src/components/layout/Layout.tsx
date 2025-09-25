import React from 'react';
import { Sidebar } from './Sidebar';
import { Toolbar } from './Toolbar';
import { PanelResizer } from '../ui/PanelResizer';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
  onEditorNavigation?: (line: number) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onEditorNavigation }) => {
  const { 
    sidebarVisible, 
    sidebarWidth,
    previewVisible, 
    setSidebarWidth
  } = useUIStore();
  
  const { effectiveTheme } = useTheme();

  const handleSidebarResize = (delta: number) => {
    const newWidth = Math.max(200, Math.min(600, sidebarWidth + delta));
    setSidebarWidth(newWidth);
  };

  return (
    <div className={`h-screen flex flex-col bg-white dark:bg-gray-900 ${effectiveTheme === 'dark' ? 'dark' : ''}`}>
      <Toolbar />
      <div className="flex-1 flex overflow-hidden bg-white dark:bg-gray-900">
        <div 
          className={`transition-all duration-300 ease-in-out ${
            sidebarVisible ? 'flex-shrink-0' : 'w-0'
          }`}
          style={{ width: sidebarVisible ? `${sidebarWidth}px` : '0px' }}
        >
          {sidebarVisible && (
            <>
              <div className="h-full">
                <Sidebar onEditorNavigation={onEditorNavigation} />
              </div>
              <PanelResizer
                direction="horizontal"
                onResize={handleSidebarResize}
                className="flex-shrink-0"
                minSize={200}
                maxSize={600}
              />
            </>
          )}
        </div>
        <main className="flex-1 flex min-w-0 bg-white dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
};