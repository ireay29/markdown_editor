import React from 'react';
import { X, Moon, Sun, Type, AlignLeft, Eye, Code2, Monitor, RotateCcw } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useTheme } from '../../hooks/useTheme';
import { useSettings } from '../../hooks/useSettings';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    fontSize,
    lineHeight,
    wordWrap,
    showLineNumbers,
    enableSyntaxHighlight,
    enableLivePreview,
    setTheme,
    setFontSize,
    setLineHeight,
    setWordWrap,
    setShowLineNumbers,
    setEnableLivePreview,
    toggleSyntaxHighlight,
    toggleWordWrap,
    toggleLineNumbers
  } = useUIStore();

  const { effectiveTheme } = useTheme();
  const { resetSettings } = useSettings();

  const handleReset = () => {
    const confirmed = confirm('Reset all settings to default values?');
    if (confirmed) {
      resetSettings();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Theme Section */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              {theme === 'light' ? <Sun className="w-4 h-4" /> : 
               theme === 'dark' ? <Moon className="w-4 h-4" /> : 
               <Monitor className="w-4 h-4" />}
              Appearance
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm">Theme</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => setTheme('system')}
                    className={`px-3 py-1 text-xs rounded ${
                      theme === 'system'
                        ? 'bg-blue-500 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    System
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-3 py-1 text-xs rounded ${
                      theme === 'light'
                        ? 'bg-blue-500 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-1 text-xs rounded ${
                      theme === 'dark'
                        ? 'bg-blue-500 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>
              {theme === 'system' && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Currently using: {effectiveTheme} theme
                </div>
              )}
            </div>
          </div>

          {/* Editor Section */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Type className="w-4 h-4" />
              Editor
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm">Font Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm w-8 text-right">{fontSize}px</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Line Height</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.1"
                    value={lineHeight}
                    onChange={(e) => setLineHeight(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm w-8 text-right">{lineHeight}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Word Wrap</label>
                <button
                  onClick={toggleWordWrap}
                  className={`px-3 py-1 text-sm rounded ${
                    wordWrap
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {wordWrap ? 'On' : 'Off'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Line Numbers</label>
                <button
                  onClick={toggleLineNumbers}
                  className={`px-3 py-1 text-sm rounded ${
                    showLineNumbers
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {showLineNumbers ? 'On' : 'Off'}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm">Syntax Highlighting</label>
                <button
                  onClick={toggleSyntaxHighlight}
                  className={`px-3 py-1 text-sm rounded ${
                    enableSyntaxHighlight
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {enableSyntaxHighlight ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm">Live Preview</label>
                <button
                  onClick={() => setEnableLivePreview(!enableLivePreview)}
                  className={`px-3 py-1 text-sm rounded ${
                    enableLivePreview
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {enableLivePreview ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              Keyboard Shortcuts
            </h3>
            <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>New File</span>
                <span className="font-mono">Ctrl+N</span>
              </div>
              <div className="flex justify-between">
                <span>Open File</span>
                <span className="font-mono">Ctrl+O</span>
              </div>
              <div className="flex justify-between">
                <span>Save</span>
                <span className="font-mono">Ctrl+S</span>
              </div>
              <div className="flex justify-between">
                <span>Save As</span>
                <span className="font-mono">Ctrl+Shift+S</span>
              </div>
              <div className="flex justify-between">
                <span>Toggle Sidebar</span>
                <span className="font-mono">Ctrl+B</span>
              </div>
              <div className="flex justify-between">
                <span>Toggle Preview</span>
                <span className="font-mono">Ctrl+P</span>
              </div>
            </div>
          </div>

          {/* Reset Settings */}
          <div className="pt-4 border-t dark:border-gray-700">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};