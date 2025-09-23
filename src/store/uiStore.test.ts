import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('UIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useUIStore.getState();
    useUIStore.setState({
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
    });
  });

  it('has correct initial state', () => {
    const state = useUIStore.getState();
    
    expect(state.sidebarVisible).toBe(true);
    expect(state.sidebarWidth).toBe(300);
    expect(state.sidebarActiveTab).toBe('outline');
    expect(state.previewVisible).toBe(true);
    expect(state.previewWidth).toBe(400);
    expect(state.theme).toBe('system');
    expect(state.fontSize).toBe(14);
    expect(state.lineHeight).toBe(1.5);
    expect(state.wordWrap).toBe(true);
    expect(state.showLineNumbers).toBe(true);
    expect(state.enableSyntaxHighlight).toBe(true);
    expect(state.enableLivePreview).toBe(true);
  });

  it('toggles sidebar visibility', () => {
    const { toggleSidebar } = useUIStore.getState();
    
    toggleSidebar();
    expect(useUIStore.getState().sidebarVisible).toBe(false);
    
    toggleSidebar();
    expect(useUIStore.getState().sidebarVisible).toBe(true);
  });

  it('toggles preview visibility', () => {
    const { togglePreview } = useUIStore.getState();
    
    togglePreview();
    expect(useUIStore.getState().previewVisible).toBe(false);
    
    togglePreview();
    expect(useUIStore.getState().previewVisible).toBe(true);
  });

  it('cycles through themes correctly', () => {
    const { toggleTheme } = useUIStore.getState();
    
    // system -> light
    toggleTheme();
    expect(useUIStore.getState().theme).toBe('light');
    
    // light -> dark
    toggleTheme();
    expect(useUIStore.getState().theme).toBe('dark');
    
    // dark -> system
    toggleTheme();
    expect(useUIStore.getState().theme).toBe('system');
  });

  it('sets sidebar width', () => {
    const { setSidebarWidth } = useUIStore.getState();
    
    setSidebarWidth(250);
    expect(useUIStore.getState().sidebarWidth).toBe(250);
  });

  it('sets preview width', () => {
    const { setPreviewWidth } = useUIStore.getState();
    
    setPreviewWidth(500);
    expect(useUIStore.getState().previewWidth).toBe(500);
  });

  it('sets sidebar active tab', () => {
    const { setSidebarActiveTab } = useUIStore.getState();
    
    setSidebarActiveTab('variables');
    expect(useUIStore.getState().sidebarActiveTab).toBe('variables');
    
    setSidebarActiveTab('blocks');
    expect(useUIStore.getState().sidebarActiveTab).toBe('blocks');
  });

  it('sets theme directly', () => {
    const { setTheme } = useUIStore.getState();
    
    setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
    
    setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
    
    setTheme('system');
    expect(useUIStore.getState().theme).toBe('system');
  });

  it('sets font size', () => {
    const { setFontSize } = useUIStore.getState();
    
    setFontSize(16);
    expect(useUIStore.getState().fontSize).toBe(16);
    
    setFontSize(12);
    expect(useUIStore.getState().fontSize).toBe(12);
  });

  it('sets line height', () => {
    const { setLineHeight } = useUIStore.getState();
    
    setLineHeight(1.8);
    expect(useUIStore.getState().lineHeight).toBe(1.8);
    
    setLineHeight(1.2);
    expect(useUIStore.getState().lineHeight).toBe(1.2);
  });

  it('toggles word wrap', () => {
    const { toggleWordWrap } = useUIStore.getState();
    
    toggleWordWrap();
    expect(useUIStore.getState().wordWrap).toBe(false);
    
    toggleWordWrap();
    expect(useUIStore.getState().wordWrap).toBe(true);
  });

  it('toggles line numbers', () => {
    const { toggleLineNumbers } = useUIStore.getState();
    
    toggleLineNumbers();
    expect(useUIStore.getState().showLineNumbers).toBe(false);
    
    toggleLineNumbers();
    expect(useUIStore.getState().showLineNumbers).toBe(true);
  });

  it('toggles syntax highlight', () => {
    const { toggleSyntaxHighlight } = useUIStore.getState();
    
    toggleSyntaxHighlight();
    expect(useUIStore.getState().enableSyntaxHighlight).toBe(false);
    
    toggleSyntaxHighlight();
    expect(useUIStore.getState().enableSyntaxHighlight).toBe(true);
  });

  it('sets word wrap directly', () => {
    const { setWordWrap } = useUIStore.getState();
    
    setWordWrap(false);
    expect(useUIStore.getState().wordWrap).toBe(false);
    
    setWordWrap(true);
    expect(useUIStore.getState().wordWrap).toBe(true);
  });

  it('sets show line numbers directly', () => {
    const { setShowLineNumbers } = useUIStore.getState();
    
    setShowLineNumbers(false);
    expect(useUIStore.getState().showLineNumbers).toBe(false);
    
    setShowLineNumbers(true);
    expect(useUIStore.getState().showLineNumbers).toBe(true);
  });

  it('sets enable live preview', () => {
    const { setEnableLivePreview } = useUIStore.getState();
    
    setEnableLivePreview(false);
    expect(useUIStore.getState().enableLivePreview).toBe(false);
    
    setEnableLivePreview(true);
    expect(useUIStore.getState().enableLivePreview).toBe(true);
  });

  it('sets sidebar visibility directly', () => {
    const { setSidebarVisible } = useUIStore.getState();
    
    setSidebarVisible(false);
    expect(useUIStore.getState().sidebarVisible).toBe(false);
    
    setSidebarVisible(true);
    expect(useUIStore.getState().sidebarVisible).toBe(true);
  });

  it('sets preview visibility directly', () => {
    const { setPreviewVisible } = useUIStore.getState();
    
    setPreviewVisible(false);
    expect(useUIStore.getState().previewVisible).toBe(false);
    
    setPreviewVisible(true);
    expect(useUIStore.getState().previewVisible).toBe(true);
  });
});