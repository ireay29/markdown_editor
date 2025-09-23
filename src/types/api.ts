export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FileOperationResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface ParseResult {
  blocks: Block[];
  outline: HeadingNode[];
  errors: SyntaxError[];
}

export interface HeadingNode {
  id: string;
  level: number;
  title: string;
  line: number;
  children: HeadingNode[];
}

export interface SyntaxError {
  id: string;
  type: string;
  message: string;
  position: Position;
  severity: 'error' | 'warning' | 'info';
}