import React, { useState } from 'react';
import { FileText, Save, FolderOpen, Download, Settings, Moon, Sun, Eye, EyeOff, Sidebar, Code } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useEditorStore } from '../../store/editorStore';
import { useFileOperations } from '../../hooks/useFileOperations';
import { SettingsPanel } from '../settings/SettingsPanel';

export const Toolbar: React.FC = () => {
  const { theme, toggleTheme, sidebarVisible, previewVisible, enableSyntaxHighlight, toggleSidebar, togglePreview, toggleSyntaxHighlight } = useUIStore();
  const { currentDocument, isModified } = useEditorStore();
  const { newFile, saveFile, saveAs, readFile, canSave, currentFileName, isReadonly } = useFileOperations();
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleNewFile = async () => {
    if (isModified) {
      try {
        const { ask } = await import('@tauri-apps/plugin-dialog');
        const shouldDiscard = await ask('未保存の変更があります。新しいファイルを作成しますか？', {
          title: '確認',
          type: 'warning'
        });
        if (!shouldDiscard) return;
      } catch (error) {
        console.error('Dialog error:', error);
        // フォールバック: 通常のconfirm
        const shouldDiscard = confirm('未保存の変更があります。新しいファイルを作成しますか？');
        if (!shouldDiscard) return;
      }
    }
    newFile();
  };

  const handleOpenFile = async () => {
    console.log('handleOpenFile called, isModified:', isModified);

    if (isModified) {
      console.log('Showing confirmation dialog for unsaved changes');
      try {
        const { ask } = await import('@tauri-apps/plugin-dialog');
        const shouldDiscard = await ask('未保存の変更があります。ファイルを開きますか？', {
          title: '確認',
          type: 'warning'
        });
        console.log('User choice for unsaved changes:', shouldDiscard);
        if (!shouldDiscard) {
          console.log('User cancelled due to unsaved changes');
          return;
        }
      } catch (error) {
        console.error('Dialog error:', error);
        // フォールバック: 通常のconfirm
        const shouldDiscard = confirm('未保存の変更があります。ファイルを開きますか？');
        console.log('User choice for unsaved changes (fallback):', shouldDiscard);
        if (!shouldDiscard) {
          console.log('User cancelled due to unsaved changes (fallback)');
          return;
        }
      }
    }

    console.log('Proceeding to open file dialog');

    try {
      setIsLoading(true);
      const { open } = await import('@tauri-apps/plugin-dialog');

      console.log('Opening file dialog...');
      const filePath = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: 'Markdown',
            extensions: ['md']
          },
          {
            name: 'テキストファイル',
            extensions: ['txt']
          },
          {
            name: 'すべてのファイル',
            extensions: ['*']
          }
        ]
      });

      console.log('Open dialog result:', filePath);

      if (filePath) {
        console.log('File selected, reading file:', filePath);
        await readFile(filePath);
        console.log('File read completed');
      } else {
        console.log('File open cancelled by user (no file selected)');
      }
    } catch (error) {
      console.error('Open file error:', error);
      if (error && error.message) {
        alert(`ファイルを開けませんでした: ${error.message}`);
      }
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('Save button clicked', { canSave, isLoading, isReadonly, currentFileName });

    if (!canSave) {
      console.log('Cannot save: canSave is false');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Attempting to save file...');

      // 新規ファイルの場合は「名前を付けて保存」にリダイレクト
      if (currentFileName === 'Untitled') {
        console.log('New file detected, using Save As...');
        await saveAs();
      } else {
        await saveFile();
      }

      console.log('File saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      alert(`ファイルの保存に失敗しました: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAs = async () => {
    try {
      setIsLoading(true);
      console.log('Save As called');
      await saveAs();
    } catch (error) {
      console.error('Save As error:', error);
      // キャンセルの場合はアラートを表示しない
      if (error && error.message && !error.message.includes('キャンセル')) {
        alert(`ファイルの保存に失敗しました: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: エクスポート機能を実装
    alert('エクスポート機能は近日実装予定です！');
  };

  return (
    <div className="h-12 bg-white dark:bg-gray-800 border-b border-secondary-200 dark:border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-300">
          <FileText className="w-4 h-4" />
          <span>Markdownエディター</span>
          <span>—</span>
          <span>{currentFileName}</span>
          {isModified && <span className="text-orange-500 font-bold">•</span>}
          {isReadonly && <span className="text-yellow-500 text-xs">[読み取り専用]</span>}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* File Operations */}
        <button
          onClick={handleNewFile}
          disabled={isLoading}
          className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-gray-700 disabled:opacity-50"
          title="新規ファイル (Ctrl+N)"
        >
          <FileText className="w-4 h-4" />
        </button>
        <button
          onClick={handleOpenFile}
          disabled={isLoading}
          className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-gray-700 disabled:opacity-50"
          title="ファイルを開く (Ctrl+O)"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || isLoading || isReadonly}
          className={`p-2 rounded hover:bg-secondary-100 dark:hover:bg-gray-700 disabled:opacity-50 ${
            canSave && !isReadonly ? 'text-primary-600 dark:text-primary-400' : ''
          }`}
          title="保存 (Ctrl+S)"
        >
          <Save className="w-4 h-4" />
        </button>
        <button
          onClick={handleSaveAs}
          disabled={isLoading}
          className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-gray-700 disabled:opacity-50"
          title="名前を付けて保存 (Ctrl+Shift+S)"
        >
          <Download className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-secondary-300 dark:bg-gray-600" />

        {/* View Controls */}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded hover:bg-secondary-100 dark:hover:bg-gray-700 ${
            sidebarVisible ? 'bg-secondary-100 dark:bg-gray-700' : ''
          }`}
          title="サイドバー表示切り替え"
        >
          <Sidebar className="w-4 h-4" />
        </button>
        <button
          onClick={togglePreview}
          className={`p-2 rounded hover:bg-secondary-100 dark:hover:bg-gray-700 ${
            previewVisible ? 'bg-secondary-100 dark:bg-gray-700' : ''
          }`}
          title="プレビュー表示切り替え"
        >
          {previewVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        <div className="w-px h-6 bg-secondary-300 dark:bg-gray-600" />

        {/* Settings */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-gray-700"
          title="テーマ切り替え"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        <button
          onClick={toggleSyntaxHighlight}
          className={`p-2 rounded hover:bg-secondary-100 dark:hover:bg-gray-700 ${
            enableSyntaxHighlight ? 'bg-secondary-100 dark:bg-gray-700' : ''
          }`}
          title="シンタックスハイライト切り替え"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          className="p-2 rounded hover:bg-secondary-100 dark:hover:bg-gray-700"
          title="設定"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
      
      <SettingsPanel 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </div>
  );
};