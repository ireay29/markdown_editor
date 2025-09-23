import { create } from 'zustand';
import type { Block, Document, HeadingNode, SyntaxError, Section } from '../types';

// Check if we're in Tauri environment
const isTauriApp = () => {
  return typeof window !== 'undefined' && 
         window.__TAURI_INTERNALS__ !== undefined;
};

// Analyze line break patterns between blocks in original content
const analyzeLineBreakPatterns = (content: string, blocks: Block[]): Map<string, number> => {
  const patterns = new Map<string, number>();
  const lines = content.split('\n');
  
  // Sort blocks by their position to match original order
  const sortedBlocks = [...blocks].sort((a, b) => 
    (a.position?.startLine || 0) - (b.position?.startLine || 0)
  );
  
  for (let i = 0; i < sortedBlocks.length - 1; i++) {
    const currentBlock = sortedBlocks[i];
    const nextBlock = sortedBlocks[i + 1];
    
    if (currentBlock.position && nextBlock.position) {
      const currentEndLine = currentBlock.position.endLine;
      const nextStartLine = nextBlock.position.startLine;
      
      // Count empty lines between blocks
      let emptyLines = 0;
      for (let lineNum = currentEndLine + 1; lineNum < nextStartLine; lineNum++) {
        if (lineNum < lines.length && lines[lineNum].trim() === '') {
          emptyLines++;
        }
      }
      
      // Store pattern: total newlines = empty lines + 1 (the basic newline)
      const totalNewlines = emptyLines + 1;
      patterns.set(`${currentBlock.id}->${nextBlock.id}`, totalNewlines);
    }
  }
  
  return patterns;
};

// Reconstruct content with original line break patterns
const reconstructContentWithOriginalSpacing = (
  reorderedBlocks: Block[], 
  lineBreakPatterns: Map<string, number>
): string => {
  const reconstructBlock = (block: Block) => {
    if (block.type?.kind === 'heading') {
      const level = block.type.level || 1;
      const hashes = '#'.repeat(level);
      return `${hashes} ${block.content}`;
    }
    return block.content;
  };
  
  if (reorderedBlocks.length === 0) return '';
  if (reorderedBlocks.length === 1) return reconstructBlock(reorderedBlocks[0]);
  
  const result: string[] = [];
  
  for (let i = 0; i < reorderedBlocks.length; i++) {
    const currentBlock = reorderedBlocks[i];
    result.push(reconstructBlock(currentBlock));
    
    // Don't add spacing after the last block
    if (i < reorderedBlocks.length - 1) {
      const nextBlock = reorderedBlocks[i + 1];
      const patternKey = `${currentBlock.id}->${nextBlock.id}`;
      
      // Try to find the original pattern
      let newlines = lineBreakPatterns.get(patternKey);
      
      if (newlines === undefined) {
        // Fallback: use common markdown spacing conventions
        if (currentBlock.type?.kind === 'paragraph') {
          newlines = 2; // Blank line after paragraphs
        } else {
          newlines = 1; // Single line after headings, lists, etc.
        }
      }
      
      // Add the appropriate number of newlines
      result.push('\n'.repeat(newlines));
    }
  }
  
  return result.join('');
};

// Group blocks into sections based on H1 headings
const groupBlocksIntoSections = (blocks: Block[]): Section[] => {
  const sections: Section[] = [];
  let currentSection: Partial<Section> | null = null;

  blocks.forEach((block, index) => {
    if (block.type?.kind === 'heading' && block.type.level === 1) {
      // Start new section with H1 heading
      if (currentSection) {
        // Complete previous section
        sections.push(currentSection as Section);
      }

      currentSection = {
        id: `section-${block.id}`,
        title: block.content || 'Untitled Section',
        headerBlock: block,
        blocks: [],
        position: {
          startIndex: index,
          endIndex: index
        }
      };
    } else if (currentSection) {
      // Add block to current section
      currentSection.blocks!.push(block);
      currentSection.position!.endIndex = index;
    }
    // Removed: blocks before first H1 are now ignored for section grouping
  });

  // Complete final section
  if (currentSection && !sections.includes(currentSection as Section)) {
    sections.push(currentSection as Section);
  }

  return sections;
};

interface EditorState {
  // Document state
  currentDocument: Document | null;
  isModified: boolean;
  isLoading: boolean;

  // Content
  content: string;
  blocks: Block[];
  outline: HeadingNode[];
  syntaxErrors: SyntaxError[];

  // Editor instance
  codeMirrorView: any | null;

  // Sections
  sections: Section[];
  viewMode: 'blocks' | 'sections';
  
  // Actions
  setContent: (content: string) => void;
  setCurrentDocument: (document: Document | null) => void;
  setIsModified: (modified: boolean) => void;
  setBlocks: (blocks: Block[]) => void;
  setSyntaxErrors: (errors: SyntaxError[]) => void;
  setOutline: (outline: HeadingNode[]) => void;
  setCodeMirrorView: (view: any | null) => void;
  
  // Section actions
  setSections: (sections: Section[]) => void;
  setViewMode: (mode: 'blocks' | 'sections') => void;
  reorderSections: (newOrder: string[]) => Promise<void>;
  
  // Block management actions
  reorderBlocks: (newOrder: string[]) => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  duplicateBlock: (blockId: string) => Promise<void>;
  
  // Block UI state
  selectedBlockId: string | null;
  setSelectedBlockId: (blockId: string | null) => void;
  dragMode: boolean;
  setDragMode: (enabled: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  // Initial state
  currentDocument: null,
  isModified: false,
  isLoading: false,
  content: '',
  blocks: [],
  outline: [],
  syntaxErrors: [],
  codeMirrorView: null,
  sections: [],
  viewMode: 'blocks',
  selectedBlockId: null,
  dragMode: false,
  
  // Actions
  setContent: (content) => set({ content, isModified: true }),
  setCurrentDocument: (document) => set({ currentDocument: document, isModified: false }),
  setIsModified: (isModified) => set({ isModified }),
  setBlocks: (blocks) => {
    const sections = groupBlocksIntoSections(blocks);
    set({ blocks, sections });
  },
  setSyntaxErrors: (syntaxErrors) => set({ syntaxErrors }),
  setOutline: (outline: HeadingNode[]) => set({ outline }),
  setCodeMirrorView: (codeMirrorView) => set({ codeMirrorView }),
  
  // Section actions
  setSections: (sections) => set({ sections }),
  setViewMode: (viewMode) => set({ viewMode }),
  
  reorderSections: async (newOrder) => {
    const { sections, blocks, content } = useEditorStore.getState();

    // Analyze original line break patterns
    const lineBreakPatterns = analyzeLineBreakPatterns(content, blocks);

    // Find blocks that don't belong to any section (orphan blocks)
    const blocksInSections = new Set<string>();
    sections.forEach(section => {
      blocksInSections.add(section.headerBlock.id);
      section.blocks.forEach(block => blocksInSections.add(block.id));
    });

    const orphanBlocks = blocks.filter(block => !blocksInSections.has(block.id));

    // Reorder sections
    const reorderedSections = newOrder.map(id => {
      const section = sections.find(s => s.id === id);
      return section;
    }).filter(Boolean);

    // Flatten sections back to blocks in new order, preserving orphan blocks at the beginning
    const reorderedBlocks: Block[] = [];

    // Add orphan blocks first (blocks that are not in any section)
    reorderedBlocks.push(...orphanBlocks);

    // Add sections in new order
    reorderedSections.forEach(section => {
      if (section) {
        reorderedBlocks.push(section.headerBlock);
        reorderedBlocks.push(...section.blocks);
      }
    });

    // Reconstruct content with original spacing
    const newContent = reconstructContentWithOriginalSpacing(reorderedBlocks, lineBreakPatterns);
    
    console.log('Reordering sections with preserved spacing:', {
      originalContent: content,
      newContent: newContent,
      sectionOrder: reorderedSections.map(s => s.title),
      detectedPatterns: Array.from(lineBreakPatterns.entries())
    });
    
    set({
      content: newContent,
      blocks: reorderedBlocks,
      sections: reorderedSections,
      isModified: true
    });
  },
    
  // Block management actions
  reorderBlocks: async (newOrder) => {
    const { content, blocks } = useEditorStore.getState();
    
    // Analyze original line break patterns
    const lineBreakPatterns = analyzeLineBreakPatterns(content, blocks);
    
    // Frontend-only reordering for now (since backend returns empty results)
    const reorderedBlocks = newOrder.map(id => {
      const block = blocks.find(b => b.id === id);
      return block;
    }).filter(Boolean); // Remove undefined entries
    
    // Reconstruct content with original spacing
    const newContent = reconstructContentWithOriginalSpacing(reorderedBlocks, lineBreakPatterns);
    
    console.log('Reordering content with preserved spacing:', {
      originalContent: content,
      newContent: newContent,
      blockOrder: reorderedBlocks.map(b => `${b.content?.substring(0, 20)}...`),
      detectedPatterns: Array.from(lineBreakPatterns.entries())
    });
    
    set({
      content: newContent,
      blocks: reorderedBlocks,
      isModified: true
    });
    
    // Optional: Still try to call backend but don't rely on its result
    if (isTauriApp()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('reorder_blocks', {
          originalContent: content,
          newBlockOrder: newOrder
        });
      } catch (error) {
        // Silently ignore backend errors for now
      }
    }
  },
  
  deleteBlock: async (blockId) => {
    if (!isTauriApp()) {
      console.warn('deleteBlock: Not in Tauri environment');
      return;
    }
    
    const { content } = useEditorStore.getState();
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke('delete_block', {
        content,
        blockId
      });
      if (result.success) {
        set({
          blocks: result.updatedBlocks,
          selectedBlockId: null,
          isModified: true
        });
      }
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  },
  
  duplicateBlock: async (blockId) => {
    if (!isTauriApp()) {
      console.warn('duplicateBlock: Not in Tauri environment');
      return;
    }
    
    const { content } = useEditorStore.getState();
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke('duplicate_block', {
        content,
        blockId
      });
      if (result.success) {
        set({
          blocks: result.updatedBlocks,
          isModified: true
        });
      }
    } catch (error) {
      console.error('Failed to duplicate block:', error);
    }
  },
  
  setSelectedBlockId: (blockId) => set({ selectedBlockId: blockId }),
  setDragMode: (dragMode) => set({ dragMode }),
}));