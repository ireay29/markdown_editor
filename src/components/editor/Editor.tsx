import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useUIStore } from '../../store/uiStore';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useMarkdownParser } from '../../hooks/useMarkdownParser';

interface CursorPosition {
  line: number;
  column: number;
}

export const Editor: React.FC = () => {
  const { content, setContent, setIsModified } = useEditorStore();
  const { fontSize, lineHeight, wordWrap, showLineNumbers } = useUIStore();
  const { saveFile, newFile, canSave } = useFileOperations();
  const { debouncedParse } = useMarkdownParser();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ line: 1, column: 1 });
  const [undoHistory, setUndoHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);

  // カーソル位置を計算する関数
  const calculateCursorPosition = useCallback((text: string, cursorIndex: number) => {
    const lines = text.substring(0, cursorIndex).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }, []);

  // コンテンツ変更ハンドラー
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    
    // アンドゥ履歴を更新
    if (content !== newContent) {
      setUndoHistory(prev => [...prev.slice(-19), content]); // 最大20個まで保持
      setRedoHistory([]); // 新しい変更があったらリドゥ履歴をクリア
    }
    
    setContent(newContent);
    setIsModified(true);
    
    // リアルタイムMarkdown解析を実行
    debouncedParse(newContent);
  };

  // カーソル位置変更ハンドラー
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      const cursorIndex = textareaRef.current.selectionStart;
      const position = calculateCursorPosition(content, cursorIndex);
      setCursorPosition(position);
    }
  };

  // キーボードショートカットハンドラー
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+S: 保存
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (canSave) {
        saveFile().catch((error) => {
          console.error('Save failed:', error);
        });
      }
    }

    // Ctrl+N: 新規ファイル
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      newFile();
    }

    // Ctrl+Z: アンドゥ
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (undoHistory.length > 0) {
        const lastState = undoHistory[undoHistory.length - 1];
        setRedoHistory(prev => [content, ...prev.slice(0, 19)]);
        setUndoHistory(prev => prev.slice(0, -1));
        setContent(lastState);
      }
    }
    
    // Ctrl+Shift+Z または Ctrl+Y: リドゥ
    if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
      e.preventDefault();
      if (redoHistory.length > 0) {
        const nextState = redoHistory[0];
        setUndoHistory(prev => [...prev, content]);
        setRedoHistory(prev => prev.slice(1));
        setContent(nextState);
      }
    }

    // Tab: インデント
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current!;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      
      // カーソル位置を調整
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // 行番号を生成
  const generateLineNumbers = () => {
    const lines = content.split('\n');
    return lines.map((_, index) => (
      <div
        key={index}
        className="text-right pr-2 text-secondary-500 dark:text-secondary-400 select-none"
        style={{ 
          fontSize: `${fontSize}px`,
          lineHeight: lineHeight,
          minHeight: `${fontSize * lineHeight}px`
        }}
      >
        {index + 1}
      </div>
    ));
  };

  // エフェクト: カーソル位置の初期化
  useEffect(() => {
    handleSelectionChange();
  }, [content]);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* エディター本体 */}
      <div className="flex-1 flex relative bg-white dark:bg-gray-900">
        {/* 行番号 */}
        {showLineNumbers && (
          <div className="bg-secondary-100/50 dark:bg-gray-800/50 border-r border-secondary-200 dark:border-gray-700 py-4 px-2 font-mono text-sm text-secondary-500 dark:text-gray-400">
            {generateLineNumbers()}
          </div>
        )}
        
        {/* テキストエリア */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelectionChange}
          onClick={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          wrap={wordWrap ? 'soft' : 'off'}
          className={`flex-1 resize-none border-none outline-none p-4 font-mono bg-transparent text-secondary-900 dark:text-secondary-100 ${
            wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
          }`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
          }}
          placeholder="Markdownを書き始めてください..."
          spellCheck={false}
        />
      </div>
      
      {/* ステータスバー */}
      <div className="bg-secondary-100 dark:bg-gray-800 border-t border-secondary-200 dark:border-gray-700 px-4 py-2 text-sm text-secondary-600 dark:text-secondary-400 flex justify-between">
        <div className="flex gap-4">
          <span>行 {cursorPosition.line}, 列 {cursorPosition.column}</span>
          <span>{content.length} 文字</span>
          <span>{content.split('\n').length} 行</span>
        </div>
        <div className="flex gap-4">
          <span>UTF-8</span>
          <span>Markdown</span>
        </div>
      </div>
    </div>
  );
};
