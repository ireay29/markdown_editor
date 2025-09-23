import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { GripVertical, Copy, Trash2, Eye, EyeOff, Grid3X3, List, ChevronDown, ChevronRight } from 'lucide-react';
import type { Block, Section } from '../../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BlockItemProps {
  block: Block;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
}

const BlockItem: React.FC<BlockItemProps> = ({
  block,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getBlockIcon = () => {
    switch (block.type?.kind) {
      case 'heading':
        return <span className="text-blue-500 font-bold">H{block.type.level}</span>;
      case 'paragraph':
        return <span className="text-gray-500">P</span>;
      case 'codeblock':
        return <span className="text-green-500 font-mono">{`{}`}</span>;
      case 'quote':
        return <span className="text-purple-500">"</span>;
      case 'list':
        return <span className="text-orange-500">•</span>;
      case 'table':
        return <span className="text-indigo-500">⊞</span>;
      default:
        return <span className="text-gray-400">□</span>;
    }
  };

  const getBlockTypeLabel = () => {
    const type = block.type;
    
    if (!type || !type.kind) {
      return '不明なブロック';
    }
    
    switch (type.kind) {
      case 'heading':
        return `見出し ${type.level || ''}`;
      case 'list':
        return type.ordered ? '番号付きリスト' : '箇条書きリスト';
      case 'codeblock':
        return `コードブロック${type.language ? ` (${type.language})` : ''}`;
      case 'paragraph':
        return '段落';
      case 'quote':
        return '引用';
      case 'table':
        return 'テーブル';
      case 'hr':
        return '水平線';
      default:
        return (type.kind as string).replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
  };

  const truncateContent = (content: string, maxLength: number = 50) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
      } ${isDragging ? 'shadow-lg' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(block.id)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute left-1 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing transition-opacity ${
          isHovered || isSelected || isDragging ? 'opacity-100' : 'opacity-0'
        }`}
        data-block-drag-handle={block.id}
      >
        <GripVertical className="w-4 h-4 text-secondary-400" />
      </div>

      {/* Block Content */}
      <div className="ml-6">
        {/* Block Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-secondary-100 dark:bg-secondary-800">
              {getBlockIcon()}
            </div>
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              {getBlockTypeLabel()}
            </span>
            <span className="text-xs text-secondary-500">
              #{block.position?.orderIndex || 0}
            </span>
          </div>

          {/* Action Buttons */}
          <div className={`flex items-center space-x-1 transition-opacity ${
            isHovered || isSelected ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(block.id);
              }}
              className="p-1 rounded hover:bg-secondary-200 dark:hover:bg-secondary-700"
              title="ブロックを複製"
            >
              <Copy className="w-3 h-3 text-secondary-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('このブロックを削除してもよろしいですか？')) {
                  onDelete(block.id);
                }
              }}
              className="p-1 rounded hover:bg-red-200 dark:hover:bg-red-700"
              title="ブロックを削除"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        </div>

        {/* Block Content Preview */}
        <div className="text-sm text-secondary-600 dark:text-secondary-400">
          <p className="font-mono text-xs bg-secondary-50 dark:bg-secondary-800 rounded px-2 py-1">
            {truncateContent(block.content || 'コンテンツなし')}
          </p>
        </div>

        {/* Block Metadata */}
        <div className="flex items-center justify-between mt-2 text-xs text-secondary-500">
          <div className="flex items-center space-x-3">
            <span>{(block.content || '').split(/\s+/).length} 語</span>
            <span>{(block.content || '').length} 文字</span>
            {block.metadata?.canDrag && (
              <span className="flex items-center">
                <GripVertical className="w-3 h-3 mr-1" />
                ドラッグ可能
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <span>{(block.position?.startLine || 0) + 1}行目</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SectionItemProps {
  section: Section;
  isSelected: boolean;
  onSelect: (sectionId: string) => void;
}

const SectionItem: React.FC<SectionItemProps> = ({
  section,
  isSelected,
  onSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const totalBlocks = section.blocks.length + 1; // +1 for header
  const totalWords = section.blocks.reduce((sum, block) => sum + (block.content || '').split(/\s+/).length, 0) + 
                     (section.headerBlock.content || '').split(/\s+/).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
      } ${isDragging ? 'shadow-lg' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(section.id)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute left-1 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing transition-opacity ${
          isHovered || isSelected || isDragging ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <GripVertical className="w-4 h-4 text-secondary-400" />
      </div>

      {/* Section Content */}
      <div className="ml-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="w-5 h-5 flex items-center justify-center hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            <div className="flex items-center justify-center w-6 h-6 rounded bg-blue-100 dark:bg-blue-800">
              <span className="text-blue-500 font-bold text-sm">H1</span>
            </div>
            <span className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
              {section.title}
            </span>
          </div>
        </div>

        {/* Section Stats */}
        <div className="flex items-center justify-between text-xs text-secondary-500 mb-2">
          <div className="flex items-center space-x-3">
            <span>{totalBlocks} 個のブロック</span>
            <span>{totalWords} 語</span>
          </div>
        </div>

        {/* Section Content Preview (when collapsed) */}
        {!isExpanded && (
          <div className="text-xs text-secondary-600 dark:text-secondary-400">
            <p className="font-mono bg-secondary-50 dark:bg-secondary-800 rounded px-2 py-1 truncate">
              {section.headerBlock.content}...
            </p>
          </div>
        )}

        {/* Expanded Section Blocks */}
        {isExpanded && (
          <div className="ml-4 border-l border-secondary-200 dark:border-secondary-700 pl-2 space-y-1">
            {/* Header Block */}
            <div className="text-xs text-secondary-600 dark:text-secondary-400 p-1 rounded bg-secondary-50 dark:bg-secondary-800">
              <span className="font-mono">
                # {section.headerBlock.content}
              </span>
            </div>
            
            {/* Section Blocks */}
            {section.blocks.map((block, index) => (
              <div key={block.id} className="text-xs text-secondary-600 dark:text-secondary-400 p-1 rounded bg-secondary-50 dark:bg-secondary-800">
                <span className="font-mono">
                  {block.content?.substring(0, 50)}{block.content && block.content.length > 50 ? '...' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const BlockViewer: React.FC = () => {
  try {
    const store = useEditorStore();
    const {
      blocks = [],
      sections = [],
      viewMode = 'blocks',
      selectedBlockId,
      setSelectedBlockId,
      deleteBlock,
      duplicateBlock,
      dragMode = false,
      setDragMode,
      setViewMode,
      reorderBlocks,
      reorderSections
    } = store;
    
    // Debug log (only when needed)
    // console.log('BlockViewer render:', { blocksLength: blocks?.length, selectedBlockId, dragMode });

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const displayBlocks = Array.isArray(blocks) ? blocks : [];
    const displaySections = Array.isArray(sections) ? sections : [];

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        if (viewMode === 'blocks') {
          const oldIndex = displayBlocks.findIndex((block) => block.id === active.id);
          const newIndex = displayBlocks.findIndex((block) => block.id === over.id);

          if (oldIndex !== -1 && newIndex !== -1 && reorderBlocks) {
            const newBlocks = arrayMove(displayBlocks, oldIndex, newIndex);
            const newOrder = newBlocks.map(block => block.id);
            reorderBlocks(newOrder);
          }
        } else if (viewMode === 'sections') {
          const oldIndex = displaySections.findIndex((section) => section.id === active.id);
          const newIndex = displaySections.findIndex((section) => section.id === over.id);

          if (oldIndex !== -1 && newIndex !== -1 && reorderSections) {
            const newSections = arrayMove(displaySections, oldIndex, newIndex);
            const newOrder = newSections.map(section => section.id);
            reorderSections(newOrder);
          }
        }
      }
    };

    if ((viewMode === 'blocks' && displayBlocks.length === 0) || (viewMode === 'sections' && displaySections.length === 0)) {
      return (
        <div className="p-4 text-center text-secondary-500 dark:text-secondary-400">
          <div className="mb-2">
            <GripVertical className="w-8 h-8 mx-auto text-secondary-300" />
          </div>
          <p className="text-sm">{viewMode === 'blocks' ? 'ブロック' : 'セクション'}が見つかりません</p>
          <p className="text-xs mt-1">
            {viewMode === 'blocks'
              ? 'Markdownを書き始めるとブロック構造が表示されます'
              : 'H1見出し (# タイトル) を追加するとセクションが作成されます'
            }
          </p>
        </div>
      );
    }

    const sortedBlocks = displayBlocks.sort((a, b) => (a.position?.orderIndex || 0) - (b.position?.orderIndex || 0));
    const sortedSections = displaySections; // Already sorted by the grouping logic

    return (
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
            文書{viewMode === 'blocks' ? 'ブロック' : 'セクション'} ({viewMode === 'blocks' ? displayBlocks.length : sections.length})
          </h3>
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-secondary-200 dark:bg-secondary-700 rounded-md p-1">
              <button
                onClick={() => setViewMode && setViewMode('blocks')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'blocks'
                    ? 'bg-white dark:bg-secondary-600 text-secondary-900 dark:text-secondary-100 shadow-sm'
                    : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
                }`}
                title="個別ブロック表示"
              >
                <List className="w-3 h-3" />
              </button>
              <button
                onClick={() => setViewMode && setViewMode('sections')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'sections'
                    ? 'bg-white dark:bg-secondary-600 text-secondary-900 dark:text-secondary-100 shadow-sm'
                    : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
                }`}
                title="セクション別表示"
              >
                <Grid3X3 className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => setDragMode && setDragMode(!dragMode)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                dragMode
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-200 text-secondary-700 hover:bg-secondary-300'
              }`}
              title={dragMode ? 'ドラッグモードを無効にする' : 'ドラッグモードを有効にする'}
            >
              <GripVertical className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Drag and Drop List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {viewMode === 'blocks' ? (
            <SortableContext
              items={sortedBlocks.map(block => block.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedBlocks.map((block) => (
                  <BlockItem
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    onSelect={setSelectedBlockId || (() => {})}
                    onDelete={deleteBlock || (() => console.warn('Delete not available'))}
                    onDuplicate={duplicateBlock || (() => console.warn('Duplicate not available'))}
                  />
                ))}
              </div>
            </SortableContext>
          ) : (
            <SortableContext
              items={sortedSections.map(section => section.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedSections.map((section) => (
                  <SectionItem
                    key={section.id}
                    section={section}
                    isSelected={selectedBlockId === section.id}
                    onSelect={setSelectedBlockId || (() => {})}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </DndContext>
      </div>
    );
  } catch (error) {
    console.error('BlockViewer error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return (
      <div className="p-4 text-center text-red-500">
        <h3 className="text-sm font-semibold mb-2">ブロック読み込みエラー</h3>
        <p className="text-xs mb-2">{error instanceof Error ? error.message : '不明なエラー'}</p>
        <details className="text-xs">
          <summary className="cursor-pointer">詳細を表示</summary>
          <pre className="mt-2 p-2 bg-red-50 dark:bg-red-900 rounded text-left overflow-auto">
            {error instanceof Error ? error.stack : String(error)}
          </pre>
        </details>
      </div>
    );
  }
};