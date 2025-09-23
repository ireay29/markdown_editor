import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { OutlineView } from '../outline/OutlineView';
import { BlockViewer } from '../editor/BlockViewer';

interface SidebarProps {
  onEditorNavigation?: (line: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onEditorNavigation }) => {
  const { sidebarActiveTab, setSidebarActiveTab, sidebarWidth } = useUIStore();

  return (
    <div
      className="bg-secondary-50 dark:bg-gray-800 border-r border-secondary-200 dark:border-gray-700 flex flex-col"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="flex border-b border-secondary-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            sidebarActiveTab === 'outline'
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400'
              : 'text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-secondary-100'
          }`}
          onClick={() => setSidebarActiveTab('outline')}
        >
          アウトライン
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            sidebarActiveTab === 'blocks'
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400'
              : 'text-secondary-600 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-secondary-100'
          }`}
          onClick={() => setSidebarActiveTab('blocks')}
        >
          ブロック
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {sidebarActiveTab === 'outline' && <OutlineView onHeadingClick={onEditorNavigation} />}
        {sidebarActiveTab === 'blocks' && <BlockViewer />}
      </div>
    </div>
  );
};