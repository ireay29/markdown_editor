import { useState, useEffect, useCallback } from 'react';
import { syntaxHighlightService, SyntaxHighlightResult } from '../services/syntaxHighlight';

interface UseSyntaxHighlightOptions {
  enabled?: boolean;
  theme?: string;
}

export const useSyntaxHighlight = (options: UseSyntaxHighlightOptions = {}) => {
  const { enabled = true } = options;
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize supported languages and themes
  useEffect(() => {
    if (!enabled) return;

    const init = async () => {
      try {
        setIsLoading(true);
        const [languages, themes] = await Promise.all([
          syntaxHighlightService.getSupportedLanguages(),
          syntaxHighlightService.getAvailableThemes(),
        ]);
        setSupportedLanguages(languages);
        setAvailableThemes(themes);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize syntax highlighting:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [enabled]);

  // Highlight a single code block
  const highlightCodeBlock = useCallback(
    async (code: string, language?: string): Promise<SyntaxHighlightResult | null> => {
      if (!enabled) return null;

      try {
        setError(null);
        const result = await syntaxHighlightService.highlightCodeBlock(code, language);
        return result;
      } catch (err) {
        console.error('Failed to highlight code block:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      }
    },
    [enabled]
  );

  // Highlight entire markdown content
  const highlightMarkdownContent = useCallback(
    async (content: string): Promise<string | null> => {
      if (!enabled) return null;

      try {
        setError(null);
        const result = await syntaxHighlightService.highlightMarkdownContent(content);
        return result;
      } catch (err) {
        console.error('Failed to highlight markdown content:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      }
    },
    [enabled]
  );

  // Check if a language is supported
  const isLanguageSupported = useCallback(
    (language: string): boolean => {
      return supportedLanguages.includes(language);
    },
    [supportedLanguages]
  );

  // Get language suggestions based on input
  const getLanguageSuggestions = useCallback(
    (input: string): string[] => {
      if (!input) return supportedLanguages.slice(0, 10);
      
      const lowerInput = input.toLowerCase();
      return supportedLanguages
        .filter(lang => lang.toLowerCase().includes(lowerInput))
        .slice(0, 10);
    },
    [supportedLanguages]
  );

  return {
    // Data
    supportedLanguages,
    availableThemes,
    
    // State
    isLoading,
    error,
    enabled,
    
    // Actions
    highlightCodeBlock,
    highlightMarkdownContent,
    isLanguageSupported,
    getLanguageSuggestions,
  };
};