import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';

// Check if we're in Tauri environment
const isTauriApp = () => {
  return typeof window !== 'undefined' && 
         window.__TAURI_INTERNALS__ !== undefined;
};

interface ParseResult {
  blocks: any[];
  outline: any[];
  syntax_errors: any[];
  metadata: {
    parse_time_ms: number;
    block_count: number;
    word_count: number;
    character_count: number;
    line_count: number;
    gfm_features: string[];
    cache_hit: boolean;
  };
}

export const useMarkdownParser = () => {
  const { content, setBlocks, setSyntaxErrors, setOutline } = useEditorStore();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastParsedContent = useRef<string>('');

  const parseMarkdown = async (markdownContent: string) => {
    try {
      // Try to import Tauri APIs dynamically
      const { invoke } = await import('@tauri-apps/api/core');
      console.log('Tauri APIs available, proceeding with markdown parsing');
      
      const result: ParseResult = await invoke('parse_markdown', {
        content: markdownContent
      });
      
      // Convert backend blocks to frontend format if needed
      console.log('Markdown parse result:', {
        blocks: result.blocks,
        blocksCount: result.blocks?.length,
        outline: result.outline,
        syntaxErrors: result.syntax_errors
      });
      
      // Transform blocks from backend format to frontend format
      const transformedBlocks = result.blocks?.map((block: any) => {
        // Convert block_type structure to type structure
        const transformBlockType = (blockType: any) => {
          if (!blockType) return { kind: 'unknown' };
          
          // Handle string-based block types
          if (typeof blockType === 'string') {
            switch (blockType) {
              case 'Paragraph':
                return { kind: 'paragraph' };
              case 'Heading':
                return { kind: 'heading', level: 1 }; // Default level
              case 'List':
                return { kind: 'list', ordered: false };
              case 'CodeBlock':
                return { kind: 'codeblock' };
              case 'Quote':
                return { kind: 'quote' };
              case 'Table':
                return { kind: 'table' };
              case 'HorizontalRule':
                return { kind: 'hr' };
              default:
                return { kind: 'unknown' };
            }
          }
          
          // Handle object-based block types
          if (blockType.Heading) {
            return { kind: 'heading', level: blockType.Heading.level };
          }
          if (blockType.Paragraph) {
            return { kind: 'paragraph' };
          }
          if (blockType.List) {
            return { kind: 'list', ordered: blockType.List.ordered || false };
          }
          if (blockType.CodeBlock) {
            return { kind: 'codeblock', language: blockType.CodeBlock.language };
          }
          if (blockType.Quote) {
            return { kind: 'quote' };
          }
          if (blockType.Table) {
            return { kind: 'table' };
          }
          if (blockType.HorizontalRule) {
            return { kind: 'hr' };
          }
          
          return { kind: 'unknown' };
        };
        
        return {
          ...block,
          type: transformBlockType(block.block_type)
        };
      }) || [];
      
      console.log('Transformed blocks:', transformedBlocks);

      setBlocks(transformedBlocks);
      setSyntaxErrors(result.syntax_errors);
      setOutline(result.outline);
      
      return result;  
    } catch (error) {
      console.log('Not in Tauri environment or Tauri APIs unavailable:', error);
      // In browser environment, we can't parse markdown, so just clear the blocks
      setBlocks([]);
      setSyntaxErrors([]);
      setOutline([]);
      return null;
    }
  };

  const debouncedParse = (content: string) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced parsing
    debounceTimeoutRef.current = setTimeout(async () => {
      if (content !== lastParsedContent.current) {
        lastParsedContent.current = content;
        await parseMarkdown(content);
      }
    }, 500); // 500ms debounce
  };

  // Parse markdown when content changes
  useEffect(() => {
    if (content && content.trim().length > 0) {
      debouncedParse(content);
    }

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [content]);

  return {
    parseMarkdown,
    debouncedParse
  };
};