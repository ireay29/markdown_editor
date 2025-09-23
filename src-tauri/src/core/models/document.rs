use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use super::Block;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub file_path: Option<PathBuf>,
    pub content: String,
    pub blocks: Vec<Block>,
    pub metadata: DocumentMetadata,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub word_count: usize,
    pub line_count: usize,
    pub character_count: usize,
    pub last_cursor_position: Option<Position>,
    pub zoom_level: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub line: usize,
    pub column: usize,
}

impl Default for DocumentMetadata {
    fn default() -> Self {
        Self {
            word_count: 0,
            line_count: 0,
            character_count: 0,
            last_cursor_position: None,
            zoom_level: 1.0,
        }
    }
}

impl Document {
    /// 新しいドキュメントを作成
    pub fn new(title: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            title: title.unwrap_or_else(|| "Untitled".to_string()),
            file_path: None,
            content: String::new(),
            blocks: Vec::new(),
            metadata: DocumentMetadata::default(),
            created_at: now,
            updated_at: now,
        }
    }

    /// ファイルから新しいドキュメントを作成
    pub fn from_file(path: PathBuf, content: String) -> Self {
        let now = Utc::now();
        let title = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Untitled")
            .to_string();

        let mut doc = Self {
            id: Uuid::new_v4().to_string(),
            title,
            file_path: Some(path),
            content: content.clone(),
            blocks: Vec::new(),
            metadata: DocumentMetadata::default(),
            created_at: now,
            updated_at: now,
        };

        doc.update_metadata();
        doc
    }

    /// コンテンツを更新
    pub fn update_content(&mut self, content: String) {
        self.content = content;
        self.updated_at = Utc::now();
        self.update_metadata();
    }

    /// メタデータを更新
    pub fn update_metadata(&mut self) {
        self.metadata.character_count = self.content.len();
        self.metadata.line_count = self.content.lines().count();
        self.metadata.word_count = self.content
            .split_whitespace()
            .count();
    }

    /// ファイルパスを設定
    pub fn set_file_path(&mut self, path: PathBuf) {
        if let Some(file_stem) = path.file_stem().and_then(|s| s.to_str()) {
            self.title = file_stem.to_string();
        }
        self.file_path = Some(path);
        self.updated_at = Utc::now();
    }

    /// ドキュメントが変更されているかチェック
    pub fn is_modified(&self) -> bool {
        // 実装を簡単にするため、常にfalseを返す
        // 実際のアプリでは、保存時の内容と現在の内容を比較する
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_document_new() {
        let doc = Document::new(Some("Test Document".to_string()));
        
        assert_eq!(doc.title, "Test Document");
        assert_eq!(doc.content, "");
        assert!(doc.file_path.is_none());
        assert_eq!(doc.blocks.len(), 0);
        assert_eq!(doc.metadata.word_count, 0);
        assert_eq!(doc.metadata.line_count, 0);
        assert_eq!(doc.metadata.character_count, 0);
    }

    #[test]
    fn test_document_new_without_title() {
        let doc = Document::new(None);
        assert_eq!(doc.title, "Untitled");
    }

    #[test]
    fn test_document_from_file() {
        let path = PathBuf::from("/path/to/test.md");
        let content = "# Hello World\n\nThis is a test document.".to_string();
        let doc = Document::from_file(path.clone(), content.clone());
        
        assert_eq!(doc.title, "test");
        assert_eq!(doc.content, content);
        assert_eq!(doc.file_path, Some(path));
        assert_eq!(doc.metadata.character_count, content.len());
        assert_eq!(doc.metadata.line_count, 3);
        assert_eq!(doc.metadata.word_count, 8);
    }

    #[test]
    fn test_update_content() {
        let mut doc = Document::new(Some("Test".to_string()));
        let original_updated_at = doc.updated_at;
        
        // 少し待つ（タイムスタンプの差を作るため）
        std::thread::sleep(std::time::Duration::from_millis(1));
        
        let new_content = "New content with more words here.".to_string();
        doc.update_content(new_content.clone());
        
        assert_eq!(doc.content, new_content);
        assert!(doc.updated_at > original_updated_at);
        assert_eq!(doc.metadata.character_count, new_content.len());
        assert_eq!(doc.metadata.word_count, 6);
        assert_eq!(doc.metadata.line_count, 1);
    }

    #[test]
    fn test_update_metadata() {
        let mut doc = Document::new(Some("Test".to_string()));
        doc.content = "Line 1\nLine 2\nLine 3 with multiple words".to_string();
        
        doc.update_metadata();
        
        assert_eq!(doc.metadata.line_count, 3);
        // "Line" "1" "Line" "2" "Line" "3" "with" "multiple" "words" = 9 words
        assert_eq!(doc.metadata.word_count, 9);
        assert_eq!(doc.metadata.character_count, doc.content.len());
    }

    #[test]
    fn test_set_file_path() {
        let mut doc = Document::new(Some("Original".to_string()));
        let original_updated_at = doc.updated_at;
        
        std::thread::sleep(std::time::Duration::from_millis(1));
        
        let path = PathBuf::from("/new/path/document.md");
        doc.set_file_path(path.clone());
        
        assert_eq!(doc.title, "document");
        assert_eq!(doc.file_path, Some(path));
        assert!(doc.updated_at > original_updated_at);
    }

    #[test]
    fn test_is_modified() {
        let doc = Document::new(Some("Test".to_string()));
        // 現在の実装では常にfalseを返す
        assert!(!doc.is_modified());
    }

    #[test]
    fn test_position() {
        let pos = Position { line: 10, column: 5 };
        assert_eq!(pos.line, 10);
        assert_eq!(pos.column, 5);
    }

    #[test]
    fn test_document_metadata_default() {
        let metadata = DocumentMetadata::default();
        assert_eq!(metadata.word_count, 0);
        assert_eq!(metadata.line_count, 0);
        assert_eq!(metadata.character_count, 0);
        assert!(metadata.last_cursor_position.is_none());
        assert_eq!(metadata.zoom_level, 1.0);
    }
}