import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPanel } from './SettingsPanel';

// Mock the useUIStore hook
const mockUIStore = {
  theme: 'light' as const,
  fontSize: 14,
  lineHeight: 1.5,
  wordWrap: true,
  showLineNumbers: true,
  enableSyntaxHighlight: true,
  enableLivePreview: true,
  setTheme: vi.fn(),
  setFontSize: vi.fn(),
  setLineHeight: vi.fn(),
  setWordWrap: vi.fn(),
  setShowLineNumbers: vi.fn(),
  setEnableLivePreview: vi.fn(),
  toggleSyntaxHighlight: vi.fn(),
  toggleWordWrap: vi.fn(),
  toggleLineNumbers: vi.fn(),
};

const mockTheme = {
  effectiveTheme: 'light' as const,
};

const mockSettings = {
  resetSettings: vi.fn(),
};

vi.mock('../../store/uiStore', () => ({
  useUIStore: () => mockUIStore,
}));

vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => mockTheme,
}));

vi.mock('../../hooks/useSettings', () => ({
  useSettings: () => mockSettings,
}));

describe('SettingsPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn());
  });

  it('does not render when isOpen is false', () => {
    render(
      <SettingsPanel isOpen={false} onClose={mockOnClose} />
    );
    
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    // The close button has an X icon but no accessible name, so we find it by the SVG or by position
    const closeButton = screen.getAllByRole('button')[0]; // First button is the close button
    await user.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays current theme setting', () => {
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument();
  });

  it('displays font size slider with current value', () => {
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    const fontSizeSlider = screen.getByDisplayValue('14');
    expect(fontSizeSlider).toBeInTheDocument();
    expect(screen.getByText('14px')).toBeInTheDocument();
  });

  it('updates font size when slider changes', async () => {
    const user = userEvent.setup();
    
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    const fontSizeSlider = screen.getByDisplayValue('14');
    await user.clear(fontSizeSlider);
    await user.type(fontSizeSlider, '16');
    
    expect(mockUIStore.setFontSize).toHaveBeenCalledWith(16);
  });

  it('displays line height slider with current value', () => {
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    const lineHeightSlider = screen.getByDisplayValue('1.5');
    expect(lineHeightSlider).toBeInTheDocument();
    expect(screen.getByText('1.5')).toBeInTheDocument();
  });

  it('updates line height when slider changes', async () => {
    const user = userEvent.setup();
    
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    const lineHeightSlider = screen.getByDisplayValue('1.5');
    fireEvent.change(lineHeightSlider, { target: { value: '1.8' } });
    
    expect(mockUIStore.setLineHeight).toHaveBeenCalledWith(1.8);
  });

  it('toggles syntax highlighting when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    const syntaxButton = screen.getByRole('button', { name: 'On' });
    await user.click(syntaxButton);
    
    expect(mockUIStore.toggleSyntaxHighlight).toHaveBeenCalledTimes(1);
  });

  it('toggles word wrap when button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    // Find the word wrap toggle button by checking the parent text
    const buttons = screen.getAllByRole('button', { name: 'On' });
    let wordWrapButton = null;
    
    for (const button of buttons) {
      const parent = button.parentElement?.parentElement;
      if (parent?.textContent?.includes('Word Wrap')) {
        wordWrapButton = button;
        break;
      }
    }
    
    expect(wordWrapButton).toBeTruthy();
    if (wordWrapButton) {
      await user.click(wordWrapButton);
      expect(mockUIStore.toggleWordWrap).toHaveBeenCalledTimes(1);
    }
  });

  it('shows reset confirmation dialog when reset button is clicked', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.mocked(window.confirm);
    confirmSpy.mockReturnValue(true);
    
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    const resetButton = screen.getByRole('button', { name: /reset all settings/i });
    await user.click(resetButton);
    
    expect(confirmSpy).toHaveBeenCalledWith('Reset all settings to default values?');
    expect(mockSettings.resetSettings).toHaveBeenCalledTimes(1);
  });

  it('does not reset settings when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.mocked(window.confirm);
    confirmSpy.mockReturnValue(false);
    
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    const resetButton = screen.getByRole('button', { name: /reset all settings/i });
    await user.click(resetButton);
    
    expect(confirmSpy).toHaveBeenCalledWith('Reset all settings to default values?');
    expect(mockSettings.resetSettings).not.toHaveBeenCalled();
  });

  it('displays keyboard shortcuts section', () => {
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+N')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+S')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+P')).toBeInTheDocument();
  });

  it('shows system theme indicator when theme is system', () => {
    const mockSystemStore = { ...mockUIStore, theme: 'system' as const };
    vi.mocked(mockUIStore).theme = 'system';
    
    render(
      <SettingsPanel isOpen={true} onClose={mockOnClose} />
    );
    
    expect(screen.getByText(/currently using.*light.*theme/i)).toBeInTheDocument();
  });
});