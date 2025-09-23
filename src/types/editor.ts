export interface Position {
  line: number;
  column: number;
}

export interface EditorSelection {
  start: Position;
  end: Position;
  text: string;
}

export interface EditorCursor {
  line: number;
  column: number;
}

export interface Document {
  id: string;
  title: string;
  filePath?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EditorNavigationRef {
  navigateToLine: (line: number) => void;
  focus: () => void;
}