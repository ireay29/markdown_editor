import { create } from 'zustand';

interface UIState {
  sidebarVisible: boolean;
  sidebarWidth: number;
  sidebarActiveTab: 'outline' | 'blocks';
  previewVisible: boolean;
  previewWidth: number;
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  lineHeight: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  enableSyntaxHighlight: boolean;
  enableLivePreview: boolean;
  
  // Actions
  setSidebarVisible: (visible: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarActiveTab: (tab: 'outline' | 'blocks') => void;
  setPreviewVisible: (visible: boolean) => void;
  setPreviewWidth: (width: number) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: number) => void;
  setLineHeight: (lineHeight: number) => void;
  setWordWrap: (wordWrap: boolean) => void;
  setShowLineNumbers: (showLineNumbers: boolean) => void;
  setEnableLivePreview: (enableLivePreview: boolean) => void;
  toggleSidebar: () => void;
  togglePreview: () => void;
  toggleTheme: () => void;
  toggleSyntaxHighlight: () => void;
  toggleWordWrap: () => void;
  toggleLineNumbers: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  sidebarVisible: true,
  sidebarWidth: 300,
  sidebarActiveTab: 'outline',
  previewVisible: true,
  previewWidth: 400,
  theme: 'system',
  fontSize: 14,
  lineHeight: 1.5,
  wordWrap: true,
  showLineNumbers: true,
  enableSyntaxHighlight: true,
  enableLivePreview: true,
  
  // Actions
  setSidebarVisible: (sidebarVisible) => set({ sidebarVisible }),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  setSidebarActiveTab: (sidebarActiveTab) => set({ sidebarActiveTab }),
  setPreviewVisible: (previewVisible) => set({ previewVisible }),
  setPreviewWidth: (previewWidth) => set({ previewWidth }),
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLineHeight: (lineHeight) => set({ lineHeight }),
  setWordWrap: (wordWrap) => set({ wordWrap }),
  setShowLineNumbers: (showLineNumbers) => set({ showLineNumbers }),
  setEnableLivePreview: (enableLivePreview) => set({ enableLivePreview }),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  togglePreview: () => set((state) => ({ previewVisible: !state.previewVisible })),
  toggleTheme: () => set((state) => {
    const currentTheme = state.theme;
    if (currentTheme === 'system') return { theme: 'light' };
    if (currentTheme === 'light') return { theme: 'dark' };
    return { theme: 'system' };
  }),
  toggleSyntaxHighlight: () => set((state) => ({ enableSyntaxHighlight: !state.enableSyntaxHighlight })),
  toggleWordWrap: () => set((state) => ({ wordWrap: !state.wordWrap })),
  toggleLineNumbers: () => set((state) => ({ showLineNumbers: !state.showLineNumbers })),
}));