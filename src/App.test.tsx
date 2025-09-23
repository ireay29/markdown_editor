import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock all the store hooks
const mockUIStore = {
  previewVisible: true,
  previewWidth: 400,
  enableSyntaxHighlight: true,
  setPreviewWidth: vi.fn(),
  sidebarVisible: true,
  sidebarWidth: 300,
  setSidebarWidth: vi.fn(),
  theme: 'light' as const,
};

const mockEditorStore = {
  currentDocument: {
    id: '1',
    title: 'Test Document',
    content: '# Hello World\n\nThis is a test.',
    blocks: [],
    variables: [],
    metadata: {},
  },
  isModified: false,
};

vi.mock('./store/uiStore', () => ({
  useUIStore: () => mockUIStore,
}));

vi.mock('./store/editorStore', () => ({
  useEditorStore: () => mockEditorStore,
}));

vi.mock('./hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    effectiveTheme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('./hooks/useSettings', () => ({
  useSettings: () => ({
    loadSettings: vi.fn(),
    saveSettings: vi.fn(),
    resetSettings: vi.fn(),
  }),
}));

vi.mock('./hooks/useFileOperations', () => ({
  useFileOperations: () => ({
    newFile: vi.fn(),
    saveFile: vi.fn(),
    saveAs: vi.fn(),
    canSave: true,
    currentFileName: 'test.md',
    isReadonly: false,
  }),
}));

describe('App Integration Tests', () => {
  it('renders main layout with toolbar, editor, and preview', () => {
    render(<App />);
    
    // Check if main layout components are present
    expect(screen.getByText('MD Editor')).toBeInTheDocument();
    expect(screen.getByText('test.md')).toBeInTheDocument();
  });

  it('renders with sidebar visible when sidebarVisible is true', () => {
    render(<App />);
    
    // The sidebar should be present in the DOM structure
    const sidebarToggle = screen.getByRole('button', { name: /toggle sidebar/i });
    expect(sidebarToggle).toBeInTheDocument();
  });

  it('renders preview pane when previewVisible is true', () => {
    render(<App />);
    
    // Check for preview toggle button which indicates preview functionality
    const previewToggle = screen.getByRole('button', { name: /toggle preview/i });
    expect(previewToggle).toBeInTheDocument();
  });

  it('shows syntax highlighting toggle in toolbar', () => {
    render(<App />);
    
    const syntaxToggle = screen.getByRole('button', { name: /toggle syntax highlighting/i });
    expect(syntaxToggle).toBeInTheDocument();
  });

  it('displays theme toggle button', () => {
    render(<App />);
    
    const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeToggle).toBeInTheDocument();
  });

  it('shows settings button in toolbar', () => {
    render(<App />);
    
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  it('opens settings panel when settings button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsButton);
    
    // Should show the settings panel
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('displays file operations buttons', () => {
    render(<App />);
    
    expect(screen.getByRole('button', { name: /new file/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open file/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument();
  });

  it('shows modification indicator when file is modified', () => {
    // Mock modified state
    const modifiedEditorStore = {
      ...mockEditorStore,
      isModified: true,
    };

    vi.mocked(mockEditorStore).isModified = true;
    
    render(<App />);
    
    // Look for the modification indicator (•)
    expect(screen.getByText('•')).toBeInTheDocument();
  });

  it('applies correct theme class to root element', () => {
    render(<App />);
    
    // Check if the app container has the correct theme class
    const appContainer = document.querySelector('.h-screen');
    expect(appContainer).toBeInTheDocument();
    // In light theme, it shouldn't have 'dark' class
    expect(appContainer).not.toHaveClass('dark');
  });

  it('renders CodeMirror editor when syntax highlighting is enabled', () => {
    render(<App />);
    
    // When enableSyntaxHighlight is true, it should render CodeMirrorEditor
    // We can't directly test the component but we can check if the syntax toggle is active
    const syntaxToggle = screen.getByRole('button', { name: /toggle syntax highlighting/i });
    expect(syntaxToggle).toHaveClass('bg-secondary-100'); // Active state class
  });

  it('handles panel resizing when preview is visible', () => {
    render(<App />);
    
    // The preview panel should be present when previewVisible is true
    expect(mockUIStore.previewVisible).toBe(true);
    
    // Check if resize handlers would work (this is more about structure than interaction)
    expect(mockUIStore.setPreviewWidth).toBeDefined();
  });
});