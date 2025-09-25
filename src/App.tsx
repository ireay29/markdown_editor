import React, { useEffect, useRef } from 'react';
import { Layout } from './components/layout/Layout';
import { Editor } from './components/editor/Editor';
import { CodeMirrorEditor } from './components/editor/CodeMirrorEditor';
import { SyntaxErrorPanel } from './components/editor/SyntaxErrorPanel';
import { PreviewPane } from './components/preview/PreviewPane';
import { PanelResizer } from './components/ui/PanelResizer';
import { useUIStore } from './store/uiStore';
import { useEditorStore } from './store/editorStore';
import { useTheme } from './hooks/useTheme';
import { useSettings } from './hooks/useSettings';
import { useFileOperations } from './hooks/useFileOperations';
import type { EditorNavigationRef } from './types/editor';

function App() {
  const {
    previewVisible,
    previewWidth,
    enableSyntaxHighlight,
    setPreviewWidth
  } = useUIStore();

  const { isModified } = useEditorStore();

  // Editor refs for navigation
  const codeMirrorEditorRef = useRef<EditorNavigationRef>(null);
  const textareaEditorRef = useRef<HTMLTextAreaElement>(null);

  // ファイル操作
  const { saveFile, saveAs, readFile, canSave, currentFileName } = useFileOperations();

  // テーマシステムを初期化
  useTheme();

  // 設定の永続化を初期化
  useSettings();

  // エディターナビゲーション関数
  const handleEditorNavigation = (line: number) => {
    if (enableSyntaxHighlight && codeMirrorEditorRef.current) {
      codeMirrorEditorRef.current.navigateToLine(line);
      codeMirrorEditorRef.current.focus();
    } else if (!enableSyntaxHighlight && textareaEditorRef.current) {
      // テキストエリアの場合のナビゲーション（後で実装）
      console.log('Textarea navigation not implemented yet');
    }
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S (Cmd+S on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        console.log('Ctrl+S pressed, canSave:', canSave);

        if (canSave) {
          // 新規ファイルの場合は「名前を付けて保存」を使用
          if (currentFileName === 'Untitled') {
            console.log('New file detected, using Save As...');
            saveAs().catch((error) => {
              console.error('Save As failed:', error);
              // キャンセルの場合はアラートを表示しない
              if (error && error.message && !error.message.includes('キャンセル')) {
                alert(`ファイルの保存に失敗しました: ${error.message}`);
              }
            });
          } else {
            saveFile().catch((error) => {
              console.error('Save failed:', error);
              alert(`ファイルの保存に失敗しました: ${error}`);
            });
          }
        } else {
          console.log('Cannot save: no changes or no file');
        }
      }

      // Ctrl+O (Cmd+O on Mac) - ファイルを開く
      if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        console.log('Ctrl+O pressed - opening file');

        const openFile = async () => {
          try {
            console.log('Keyboard shortcut open file, isModified:', isModified);

            if (isModified) {
              console.log('Showing confirmation dialog for unsaved changes (keyboard)');
              try {
                const { ask } = await import('@tauri-apps/plugin-dialog');
                const shouldDiscard = await ask('未保存の変更があります。ファイルを開きますか？', {
                  title: '確認',
                  type: 'warning'
                });
                console.log('User choice for unsaved changes (keyboard):', shouldDiscard);
                if (!shouldDiscard) {
                  console.log('User cancelled due to unsaved changes (keyboard)');
                  return;
                }
              } catch (error) {
                console.error('Dialog error:', error);
                // フォールバック: 通常のconfirm
                const shouldDiscard = confirm('未保存の変更があります。ファイルを開きますか？');
                if (!shouldDiscard) {
                  console.log('User cancelled due to unsaved changes (keyboard, fallback)');
                  return;
                }
              }
            }

            console.log('Proceeding to open file dialog (keyboard)');
            const { open } = await import('@tauri-apps/plugin-dialog');
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

            console.log('Open dialog result (keyboard):', filePath);

            if (filePath) {
              console.log('Opening file from keyboard shortcut:', filePath);
              await readFile(filePath);
              console.log('File read completed (keyboard)');
            }
          } catch (error) {
            console.error('Failed to open file:', error);
            if (error && error.message) {
              alert(`ファイルを開けませんでした: ${error.message}`);
            }
          }
        };

        openFile();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveFile, saveAs, readFile, canSave, currentFileName, isModified]);

  const handlePreviewResize = (delta: number) => {
    const newWidth = Math.max(300, previewWidth + delta);
    setPreviewWidth(newWidth);
  };

  return (
    <Layout onEditorNavigation={handleEditorNavigation}>
      <div className="flex-1 flex flex-col min-w-0">
        {enableSyntaxHighlight ? (
          <CodeMirrorEditor ref={codeMirrorEditorRef} />
        ) : (
          <Editor />
        )}
        <SyntaxErrorPanel />
      </div>
      <div
        className={`transition-all duration-300 ease-in-out ${
          previewVisible ? 'flex-shrink-0' : 'w-0'
        }`}
        style={{ width: previewVisible ? `${previewWidth}px` : '0px' }}
      >
        {previewVisible && (
          <>
            <PanelResizer
              direction="horizontal"
              onResize={handlePreviewResize}
              className="flex-shrink-0"
              minSize={300}
            />
            <div className="w-full h-full">
              <PreviewPane />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default App;
