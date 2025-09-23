import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useUIStore } from '../../store/uiStore';

export const PreviewPane: React.FC = () => {
  const { previewWidth } = useUIStore();

  return (
    <div
      className="bg-white dark:bg-gray-900 border-l border-secondary-200 dark:border-gray-700 overflow-auto"
      style={{ width: `${previewWidth}px` }}
    >
      <div className="p-4 bg-white dark:bg-gray-900">
        <MarkdownRenderer />
      </div>
    </div>
  );
};