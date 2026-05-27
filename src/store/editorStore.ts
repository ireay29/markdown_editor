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

      const totalNewlines = nextBlock.position.startLine - currentBlock.position.endLine;
      patterns.set(`${currentBlock.id}->${nextBlock.id}`, totalNewlines);
    }
  }

  return patterns;
};

// Reconstruct content with original line break patterns
const reconstructContentWithOriginalSpacing = (
  reorderedBlocks: Block[],
  lineBreakPatterns: Map<string, number>,
  originalContent: string // Add original content parameter
): string => {
  // Extract the original raw content for each block using position offsets
  const getBlockRawContent = (block: Block): string => {
    if (block.position?.startOffset !== undefined && block.position?.endOffset !== undefined) {
      // Use the original offsets to get exact content from source
      return originalContent.slice(block.position.startOffset, block.position.endOffset);
    }

    // Fallback: reconstruct the block manually
    if (block.type?.kind === 'heading') {
      const level = block.type.level || 1;
      const hashes = '#'.repeat(level);
      return `${hashes} ${block.content}`;
    }
    return block.content || '';
  };

  if (reorderedBlocks.length === 0) return '';
  if (reorderedBlocks.length === 1) return getBlockRawContent(reorderedBlocks[0]);

  const result: string[] = [];

  for (let i = 0; i < reorderedBlocks.length; i++) {
    const currentBlock = reorderedBlocks[i];
    const rawContent = getBlockRawContent(currentBlock);
    result.push(rawContent.trimEnd()); // Remove trailing whitespace but keep content

    // Don't add spacing after the last block
    if (i < reorderedBlocks.length - 1) {
      const nextBlock = reorderedBlocks[i + 1];
      const patternKey = `${currentBlock.id}->${nextBlock.id}`;

      // Try to find the original pattern
      let newlines = lineBreakPatterns.get(patternKey);

      if (newlines === undefined) {
        // Fallback: use common markdown spacing conventions
        // Use at least 2 newlines between blocks for readability
        newlines = 2;
      }

      // Add the appropriate number of newlines (minimum 1)
      result.push('\n'.repeat(Math.max(1, newlines)));
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
  reorderSections: (activeId: string, targetIndex: number) => Promise<void>;

  // Block management actions
  reorderBlocks: (newOrder: string[]) => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  duplicateBlock: (blockId: string) => Promise<void>;

  // Block UI state
  selectedBlockId: string | null;
  setSelectedBlockId: (blockId: string | null) => void;
  dragMode: boolean;
  setDragMode: (enabled: boolean) => void;

  // Reordering state - prevents parser from overwriting reordered blocks
  isReordering: boolean;
  setIsReordering: (reordering: boolean) => void;
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
  isReordering: false,

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

  reorderSections: async (activeId, targetIndex) => {
    if (!isTauriApp()) {
      console.warn('reorderSections: Not in Tauri environment');
      return;
    }

    const { content } = useEditorStore.getState();

    // Set reordering flag
    set({ isReordering: true });

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      interface BlockOperationResult {
        success: boolean;
        updated_blocks: Block[];
        message: string;
        new_content: string;
      }

      const result = await invoke<BlockOperationResult>('move_section', {
        content,
        sectionId: activeId,
        targetIndex
      });

      if (result.success) {
        // Update blocks and sections
        const blocks = result.updated_blocks;
        const sections = groupBlocksIntoSections(blocks);

        set({
          content: result.new_content,
          blocks,
          sections,
          isModified: true
        });
      }
    } catch (error) {
      console.error('Failed to reorder section:', error);
    } finally {
      set({ isReordering: false });
    }
  },

  // Block management actions
  reorderBlocks: async (newOrder) => {
    const { content, blocks } = useEditorStore.getState();

    // Set reordering flag to prevent parser from overwriting
    set({ isReordering: true });

    // Analyze original line break patterns
    const lineBreakPatterns = analyzeLineBreakPatterns(content, blocks);

    // Frontend-only reordering with intelligent block following
    // Algorithm:
    // 1. Map all blocks to their "leader" (the block that appears in newOrder)
    //    If a block is in newOrder, it is its own leader.
    //    If a block is NOT in newOrder, it belongs to the nearest preceding block that IS in newOrder.
    // 2. Reconstruct the full list based on newOrder leaders and their followers.

    // Set of IDs included in the explicit new order
    const orderedIds = new Set(newOrder);

    // Group blocks: LeaderID -> List of Blocks (Leader itself + followers)
    const blockGroups = new Map<string, Block[]>();

    // First, initialize groups for all explicitly ordered blocks
    newOrder.forEach(id => {
      blockGroups.set(id, []);
    });

    // Special group for orphans (blocks needed before the first ordered block)
    const orphans: Block[] = [];

    let currentLeaderId: string | null = null;

    // Iterate through original blocks to assign them to groups
    blocks.forEach(block => {
      if (orderedIds.has(block.id)) {
        // This is a leader block
        currentLeaderId = block.id;
        const group = blockGroups.get(currentLeaderId);
        if (group) {
          group.push(block);
        }
      } else {
        // This is a follower block
        if (currentLeaderId && blockGroups.has(currentLeaderId)) {
          // Attach to current leader
          blockGroups.get(currentLeaderId)?.push(block);
        } else {
          // No leader yet, add to orphans
          orphans.push(block);
        }
      }
    });

    // Reconstruct the full list
    const finalBlocks: Block[] = [...orphans];

    newOrder.forEach(leaderId => {
      const group = blockGroups.get(leaderId);
      if (group) {
        finalBlocks.push(...group);
      }
    });

    const reorderedBlocks = finalBlocks;

    // Reconstruct content with original spacing
    const newContent = reconstructContentWithOriginalSpacing(reorderedBlocks, lineBreakPatterns, content);

    console.log('Reordering content with preserved follower blocks:', {
      originalContent: content,
      newContent: newContent,
      orderedIds: Array.from(orderedIds),
      totalBlocksAfter: reorderedBlocks.length
    });

    set({
      content: newContent,
      blocks: reorderedBlocks,
      isModified: true
    });

    // Reset reordering flag after a delay (longer than debounce)
    setTimeout(() => {
      set({ isReordering: false });
    }, 600);

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
  setIsReordering: (isReordering) => set({ isReordering }),
}));
