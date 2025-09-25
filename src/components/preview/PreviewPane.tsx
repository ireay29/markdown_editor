import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

export const PreviewPane: React.FC = () => {
  return (
    <div className="h-full bg-white dark:bg-gray-900 border-l border-secondary-200 dark:border-gray-700 overflow-auto">
      <div className="p-4 bg-white dark:bg-gray-900">
        <MarkdownRenderer />
      </div>
    </div>
  );
};