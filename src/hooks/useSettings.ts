import { useEffect } from 'react';
import { useUIStore } from '../store/uiStore';

const STORAGE_KEY = 'md-editor-settings';

interface StoredSettings {
  sidebarVisible: boolean;
  sidebarWidth: number;
  sidebarActiveTab: 'outline' | 'variables' | 'blocks';
  previewVisible: boolean;
  previewWidth: number;
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  lineHeight: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  enableSyntaxHighlight: boolean;
  enableLivePreview: boolean;
}

export const useSettings = () => {
  const store = useUIStore();

  // 設定をローカルストレージから読み込み
  const loadSettings = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings: Partial<StoredSettings> = JSON.parse(stored);
        
        // 各設定を復元
        if (settings.sidebarVisible !== undefined) {
          store.setSidebarVisible(settings.sidebarVisible);
        }
        if (settings.sidebarWidth !== undefined) {
          store.setSidebarWidth(settings.sidebarWidth);
        }
        if (settings.sidebarActiveTab !== undefined) {
          store.setSidebarActiveTab(settings.sidebarActiveTab);
        }
        if (settings.previewVisible !== undefined) {
          store.setPreviewVisible(settings.previewVisible);
        }
        if (settings.previewWidth !== undefined) {
          store.setPreviewWidth(settings.previewWidth);
        }
        if (settings.theme !== undefined) {
          store.setTheme(settings.theme);
        }
        if (settings.fontSize !== undefined) {
          store.setFontSize(settings.fontSize);
        }
        if (settings.lineHeight !== undefined) {
          store.setLineHeight(settings.lineHeight);
        }
        if (settings.wordWrap !== undefined) {
          store.setWordWrap(settings.wordWrap);
        }
        if (settings.showLineNumbers !== undefined) {
          store.setShowLineNumbers(settings.showLineNumbers);
        }
        if (settings.enableSyntaxHighlight !== undefined) {
          store.toggleSyntaxHighlight(); // 現在の値と異なる場合のみトグル
        }
        if (settings.enableLivePreview !== undefined) {
          store.setEnableLivePreview(settings.enableLivePreview);
        }
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
  };

  // 設定をローカルストレージに保存
  const saveSettings = () => {
    try {
      const settings: StoredSettings = {
        sidebarVisible: store.sidebarVisible,
        sidebarWidth: store.sidebarWidth,
        sidebarActiveTab: store.sidebarActiveTab,
        previewVisible: store.previewVisible,
        previewWidth: store.previewWidth,
        theme: store.theme,
        fontSize: store.fontSize,
        lineHeight: store.lineHeight,
        wordWrap: store.wordWrap,
        showLineNumbers: store.showLineNumbers,
        enableSyntaxHighlight: store.enableSyntaxHighlight,
        enableLivePreview: store.enableLivePreview,
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
  };

  // 設定をリセット
  const resetSettings = () => {
    localStorage.removeItem(STORAGE_KEY);
    // デフォルト値に戻す
    store.setSidebarVisible(true);
    store.setSidebarWidth(300);
    store.setSidebarActiveTab('outline');
    store.setPreviewVisible(true);
    store.setPreviewWidth(400);
    store.setTheme('system');
    store.setFontSize(14);
    store.setLineHeight(1.5);
    store.setWordWrap(true);
    store.setShowLineNumbers(true);
    // enableSyntaxHighlightとenableLivePreviewは適切にリセット
    if (!store.enableSyntaxHighlight) store.toggleSyntaxHighlight();
    store.setEnableLivePreview(true);
  };

  // 初回マウント時に設定を読み込み
  useEffect(() => {
    loadSettings();
  }, []);

  // ストア状態の変更を監視して自動保存
  useEffect(() => {
    const unsubscribe = useUIStore.subscribe(() => {
      // デバウンス処理（短時間での連続保存を防ぐ）
      const timeoutId = setTimeout(saveSettings, 300);
      return () => clearTimeout(timeoutId);
    });

    return unsubscribe;
  }, []);

  return {
    loadSettings,
    saveSettings,
    resetSettings,
  };
};