import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface HeadingNode {
  id: string;
  level: number;
  title: string;
  line: number;
  children: HeadingNode[];
}

interface HeadingItemProps {
  heading: HeadingNode;
  onHeadingClick?: (line: number) => void;
}

const HeadingItem: React.FC<HeadingItemProps> = ({ heading, onHeadingClick }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = heading.children && heading.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHeadingClick) {
      onHeadingClick(heading.line);
    }
  };

  const handleToggleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-700 px-2 py-1 rounded text-sm group ${
          heading.level === 1 ? 'font-semibold text-secondary-900 dark:text-secondary-100' :
          heading.level === 2 ? 'font-medium text-secondary-800 dark:text-secondary-200' :
          'text-secondary-700 dark:text-secondary-300'
        }`}
        onClick={handleClick}
        title={`${heading.line + 1}行目にジャンプ`}
      >
        {hasChildren ? (
          <button
            onClick={handleToggleExpansion}
            className="w-4 h-4 mr-1 flex items-center justify-center hover:bg-secondary-200 dark:hover:bg-secondary-600 rounded"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <div className="w-5" />
        )}
        <span className="flex-1 truncate">{heading.title}</span>
        <span className="text-xs text-secondary-400 dark:text-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity">
          L{heading.line + 1}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-4 border-l border-secondary-200 dark:border-secondary-700">
          {heading.children.map((child) => (
            <HeadingItem
              key={child.id}
              heading={child}
              onHeadingClick={onHeadingClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface OutlineViewProps {
  onHeadingClick?: (line: number) => void;
}

export const OutlineView: React.FC<OutlineViewProps> = ({ onHeadingClick }) => {
  const { outline } = useEditorStore();

  if (!outline || outline.length === 0) {
    return (
      <div className="flex h-full flex-col p-4 text-sm text-secondary-500 dark:text-secondary-400">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
            文書アウトライン
          </h3>
        </div>
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <p>見出しが見つかりません</p>
            <p className="mt-1 text-xs">見出し (# ## ###) を追加するとアウトラインが表示されます</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
          文書アウトライン
        </h3>
        <span className="text-xs text-secondary-500 dark:text-secondary-400">
          {outline.length} 個の見出し
        </span>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {outline.map((heading) => (
          <HeadingItem
            key={heading.id}
            heading={heading}
            onHeadingClick={onHeadingClick}
          />
        ))}
      </div>
    </div>
  );
};
