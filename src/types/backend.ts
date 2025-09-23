// Backend types mirroring Rust structures
export interface BackendBlock {
  id: string;
  block_type: BackendBlockType;
  content: string;
  position: BackendBlockPosition;
  metadata: BackendBlockMetadata;
}

export type BackendBlockType =
  | { Heading: { level: number } }
  | "Paragraph"
  | { List: { ordered: boolean } }
  | { CodeBlock: { language?: string } }
  | "Quote"
  | "Table"
  | "HorizontalRule"
  | { Image: { alt: string; url: string } };

export interface BackendBlockPosition {
  start_line: number;
  end_line: number;
  start_offset: number;
  end_offset: number;
  order_index: number;
}

export interface BackendBlockMetadata {
  can_drag: boolean;
  is_collapsible: boolean;
  is_collapsed: boolean;
  word_count: number;
  character_count: number;
}

// Utility functions to convert backend types to frontend types
export function convertBackendBlock(backendBlock: BackendBlock): Block {
  let blockType: BlockType;
  
  if (typeof backendBlock.block_type === 'object') {
    if ('Heading' in backendBlock.block_type) {
      blockType = {
        kind: 'heading',
        level: backendBlock.block_type.Heading.level
      };
    } else if ('List' in backendBlock.block_type) {
      blockType = {
        kind: 'list',
        ordered: backendBlock.block_type.List.ordered
      };
    } else if ('CodeBlock' in backendBlock.block_type) {
      blockType = {
        kind: 'codeblock',
        language: backendBlock.block_type.CodeBlock.language
      };
    } else if ('Image' in backendBlock.block_type) {
      blockType = {
        kind: 'paragraph' // Fallback for now
      };
    } else {
      blockType = { kind: 'paragraph' };
    }
  } else {
    switch (backendBlock.block_type) {
      case 'Paragraph':
        blockType = { kind: 'paragraph' };
        break;
      case 'Quote':
        blockType = { kind: 'quote' };
        break;
      case 'Table':
        blockType = { kind: 'table' };
        break;
      case 'HorizontalRule':
        blockType = { kind: 'hr' };
        break;
      default:
        blockType = { kind: 'paragraph' };
    }
  }

  return {
    id: backendBlock.id,
    type: blockType,
    content: backendBlock.content,
    position: {
      startLine: backendBlock.position.start_line,
      endLine: backendBlock.position.end_line,
      startOffset: backendBlock.position.start_offset,
      endOffset: backendBlock.position.end_offset,
      orderIndex: backendBlock.position.order_index,
    },
    metadata: {
      canDrag: backendBlock.metadata.can_drag,
      isCollapsible: backendBlock.metadata.is_collapsible,
      isCollapsed: backendBlock.metadata.is_collapsed,
    }
  };
}

import type { Block, BlockType } from './block';