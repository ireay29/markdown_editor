import { invoke } from '@tauri-apps/api/core';

export interface SyntaxHighlightResult {
  highlighted_html: string;
  detected_language: string;
  theme_name: string;
}

export interface SyntaxHighlightService {
  highlightCodeBlock: (code: string, language?: string) => Promise<SyntaxHighlightResult>;
  getSupportedLanguages: () => Promise<string[]>;
  getAvailableThemes: () => Promise<string[]>;
  highlightMarkdownContent: (content: string) => Promise<string>;
}

class TauriSyntaxHighlightService implements SyntaxHighlightService {
  async highlightCodeBlock(code: string, language?: string): Promise<SyntaxHighlightResult> {
    return await invoke('highlight_code_block', { code, language });
  }

  async getSupportedLanguages(): Promise<string[]> {
    return await invoke('get_supported_languages');
  }

  async getAvailableThemes(): Promise<string[]> {
    return await invoke('get_available_themes');
  }

  async highlightMarkdownContent(content: string): Promise<string> {
    return await invoke('highlight_markdown_content', { content });
  }
}

export const syntaxHighlightService = new TauriSyntaxHighlightService();