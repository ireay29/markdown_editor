export interface Block {
  id: string;
  type: BlockType;
  content: string;
  position: BlockPosition;
  metadata: BlockMetadata;
}

export interface BlockType {
  kind: 'heading' | 'paragraph' | 'list' | 'codeblock' | 'quote' | 'table' | 'hr';
  level?: number; // for headings
  ordered?: boolean; // for lists
  language?: string; // for code blocks
}

export interface BlockPosition {
  startLine: number;
  endLine: number;
  startOffset: number;
  endOffset: number;
  orderIndex: number;
}

export interface BlockMetadata {
  canDrag: boolean;
  isCollapsible: boolean;
  isCollapsed: boolean;
}

export interface Section {
  id: string;
  title: string;
  headerBlock: Block;
  blocks: Block[];
  position: {
    startIndex: number;
    endIndex: number;
  };
}