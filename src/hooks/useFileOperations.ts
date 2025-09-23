import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useEditorStore } from '../store/editorStore';
import type { Document } from '../types';

interface FileReadResult {
  content: string;
  file_info: {
    name: string;
    path: string;
    size: number;
    readonly: boolean;
  };
  encoding: string;
}

interface SaveResult {
  success: boolean;
  path: string;
  bytes_written: number;
}

export const useFileOperations = () => {
  const { 
    setContent, 
    setCurrentDocument, 
    setIsModified,
    currentDocument,
    content,
    isModified 
  } = useEditorStore();

  const readFile = useCallback(async (filePath: string): Promise<void> => {
    try {
      const result = await invoke<FileReadResult>('read_file', { path: filePath });
      
      // ファイル内容をエディターにセット
      setContent(result.content);
      
      // ドキュメント情報を更新
      const document: Document = {
        id: Date.now().toString(),
        title: result.file_info.name.replace(/\.md$/, ''),
        content: result.content,
        metadata: {
          created_at: new Date().toISOString(),
          modified_at: new Date().toISOString(),
          word_count: result.content.split(/\s+/).length,
          character_count: result.content.length,
        },
        file_path: result.file_info.path,
        is_readonly: result.file_info.readonly,
        tags: []
      };
      
      setCurrentDocument(document);
      setIsModified(false);
      
    } catch (error) {
      console.error('Failed to read file:', error);
      throw new Error(`Failed to read file: ${error}`);
    }
  }, [setContent, setCurrentDocument, setIsModified]);

  const saveFile = useCallback(async (filePath?: string): Promise<void> => {
    try {
      // 保存先のパスを決定
      const savePath = filePath || currentDocument?.file_path;

      console.log('saveFile called', { filePath, currentDocument, savePath });

      if (!savePath) {
        console.error('No file path for saving');
        throw new Error('保存するファイルパスが指定されていません。「名前を付けて保存」を使用してください。');
      }
      
      console.log('Invoking save_file command...', { path: savePath, contentLength: content.length });

      const result = await invoke<SaveResult>('save_file', {
        path: savePath,
        content
      });

      console.log('Save result:', result);

      if (result.success) {
        console.log('Save successful, updating document state');
        // ドキュメント情報を更新
        if (currentDocument) {
          const updatedDocument: Document = {
            ...currentDocument,
            content,
            metadata: {
              ...currentDocument.metadata,
              modified_at: new Date().toISOString(),
              word_count: content.split(/\s+/).length,
              character_count: content.length,
            },
            file_path: result.path
          };
          
          setCurrentDocument(updatedDocument);
        } else {
          // 新規ファイルの場合
          const newDocument: Document = {
            id: Date.now().toString(),
            title: result.path.split('/').pop()?.replace(/\.md$/, '') || 'Untitled',
            content,
            metadata: {
              created_at: new Date().toISOString(),
              modified_at: new Date().toISOString(),
              word_count: content.split(/\s+/).length,
              character_count: content.length,
            },
            file_path: result.path,
            is_readonly: false,
            tags: []
          };
          
          setCurrentDocument(newDocument);
        }
        
        setIsModified(false);
      }
      
    } catch (error) {
      console.error('Failed to save file:', error);
      throw new Error(`Failed to save file: ${error}`);
    }
  }, [content, currentDocument, setCurrentDocument, setIsModified]);

  const newFile = useCallback(() => {
    setContent('');
    setCurrentDocument(null);
    setIsModified(false);
  }, [setContent, setCurrentDocument, setIsModified]);

  const saveAs = useCallback(async (): Promise<void> => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');

      const filePath = await save({
        filters: [
          {
            name: 'Markdown',
            extensions: ['md']
          },
          {
            name: 'すべてのファイル',
            extensions: ['*']
          }
        ],
        defaultPath: 'document.md'
      });

      console.log('Save As dialog result:', filePath);

      if (filePath) {
        console.log('Calling saveFile with path:', filePath);
        await saveFile(filePath);
      } else {
        console.log('Save As cancelled by user');
        throw new Error('ファイルの保存がキャンセルされました');
      }
    } catch (error) {
      console.error('Failed to save file as:', error);
      throw error;
    }
  }, [saveFile]);

  return {
    readFile,
    saveFile,
    saveAs,
    newFile,
    canSave: isModified,
    currentFilePath: currentDocument?.file_path,
    currentFileName: currentDocument?.title || 'Untitled',
    isReadonly: currentDocument?.is_readonly || false
  };
};