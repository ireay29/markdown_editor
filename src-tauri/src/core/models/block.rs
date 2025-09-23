use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub id: String,
    pub block_type: BlockType,
    pub content: String,
    pub position: BlockPosition,
    pub metadata: BlockMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BlockType {
    Heading { level: u8 },
    Paragraph,
    List { ordered: bool },
    CodeBlock { language: Option<String> },
    Quote,
    Table,
    HorizontalRule,
    Image { alt: String, url: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockPosition {
    pub start_line: usize,
    pub end_line: usize,
    pub start_offset: usize,
    pub end_offset: usize,
    pub order_index: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockMetadata {
    pub can_drag: bool,
    pub is_collapsible: bool,
    pub is_collapsed: bool,
    pub word_count: usize,
    pub character_count: usize,
}

impl Block {
    /// 新しいブロックを作成
    pub fn new(
        block_type: BlockType,
        content: String,
        position: BlockPosition,
    ) -> Self {
        let metadata = BlockMetadata {
            can_drag: true,
            is_collapsible: matches!(block_type, BlockType::Heading { .. }),
            is_collapsed: false,
            word_count: content.split_whitespace().count(),
            character_count: content.len(),
        };

        Self {
            id: Uuid::new_v4().to_string(),
            block_type,
            content,
            position,
            metadata,
        }
    }

    /// 見出しブロックを作成
    pub fn heading(level: u8, content: String, position: BlockPosition) -> Self {
        Self::new(BlockType::Heading { level }, content, position)
    }

    /// 段落ブロックを作成
    pub fn paragraph(content: String, position: BlockPosition) -> Self {
        Self::new(BlockType::Paragraph, content, position)
    }

    /// コードブロックを作成
    pub fn code_block(
        language: Option<String>,
        content: String,
        position: BlockPosition,
    ) -> Self {
        Self::new(BlockType::CodeBlock { language }, content, position)
    }

    /// リストブロックを作成
    pub fn list(ordered: bool, content: String, position: BlockPosition) -> Self {
        Self::new(BlockType::List { ordered }, content, position)
    }

    /// 引用ブロックを作成
    pub fn quote(content: String, position: BlockPosition) -> Self {
        Self::new(BlockType::Quote, content, position)
    }

    /// テーブルブロックを作成
    pub fn table(content: String, position: BlockPosition) -> Self {
        Self::new(BlockType::Table, content, position)
    }

    /// コンテンツを更新
    pub fn update_content(&mut self, content: String) {
        self.content = content;
        self.metadata.word_count = self.content.split_whitespace().count();
        self.metadata.character_count = self.content.len();
    }

    /// ブロックの種類名を取得
    pub fn type_name(&self) -> &'static str {
        match &self.block_type {
            BlockType::Heading { .. } => "heading",
            BlockType::Paragraph => "paragraph",
            BlockType::List { .. } => "list",
            BlockType::CodeBlock { .. } => "code_block",
            BlockType::Quote => "quote",
            BlockType::Table => "table",
            BlockType::HorizontalRule => "horizontal_rule",
            BlockType::Image { .. } => "image",
        }
    }

    /// ブロックがドラッグ可能かチェック
    pub fn can_drag(&self) -> bool {
        self.metadata.can_drag
    }

    /// ブロックが折りたたみ可能かチェック
    pub fn is_collapsible(&self) -> bool {
        self.metadata.is_collapsible
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_position() -> BlockPosition {
        BlockPosition {
            start_line: 0,
            end_line: 2,
            start_offset: 0,
            end_offset: 20,
            order_index: 0,
        }
    }

    #[test]
    fn test_block_new() {
        let content = "This is test content".to_string();
        let position = create_test_position();
        let block = Block::new(BlockType::Paragraph, content.clone(), position);

        assert_eq!(block.content, content);
        assert!(matches!(block.block_type, BlockType::Paragraph));
        assert_eq!(block.metadata.word_count, 4);
        assert_eq!(block.metadata.character_count, content.len());
        assert!(block.metadata.can_drag);
        assert!(!block.metadata.is_collapsible); // Paragraph は折りたたみ不可
        assert!(!block.metadata.is_collapsed);
    }

    #[test]
    fn test_block_heading() {
        let content = "Test Heading".to_string();
        let position = create_test_position();
        let block = Block::heading(2, content.clone(), position);

        assert_eq!(block.content, content);
        assert!(matches!(block.block_type, BlockType::Heading { level: 2 }));
        assert_eq!(block.metadata.word_count, 2);
        assert!(block.metadata.is_collapsible); // Heading は折りたたみ可能
        assert_eq!(block.type_name(), "heading");
    }

    #[test]
    fn test_block_paragraph() {
        let content = "Test paragraph content".to_string();
        let position = create_test_position();
        let block = Block::paragraph(content.clone(), position);

        assert_eq!(block.content, content);
        assert!(matches!(block.block_type, BlockType::Paragraph));
        assert_eq!(block.type_name(), "paragraph");
    }

    #[test]
    fn test_block_code_block() {
        let content = "console.log('hello');".to_string();
        let position = create_test_position();
        let block = Block::code_block(Some("javascript".to_string()), content.clone(), position);

        assert_eq!(block.content, content);
        if let BlockType::CodeBlock { language } = &block.block_type {
            assert_eq!(language, &Some("javascript".to_string()));
        } else {
            panic!("Expected CodeBlock type");
        }
        assert_eq!(block.type_name(), "code_block");
    }

    #[test]
    fn test_block_list() {
        let content = "- Item 1\n- Item 2".to_string();
        let position = create_test_position();
        let block = Block::list(false, content.clone(), position);

        assert_eq!(block.content, content);
        if let BlockType::List { ordered } = &block.block_type {
            assert!(!ordered);
        } else {
            panic!("Expected List type");
        }
        assert_eq!(block.type_name(), "list");
    }

    #[test]
    fn test_block_quote() {
        let content = "> This is a quote".to_string();
        let position = create_test_position();
        let block = Block::quote(content.clone(), position);

        assert_eq!(block.content, content);
        assert!(matches!(block.block_type, BlockType::Quote));
        assert_eq!(block.type_name(), "quote");
    }

    #[test]
    fn test_block_table() {
        let content = "| Col1 | Col2 |\n|------|------|".to_string();
        let position = create_test_position();
        let block = Block::table(content.clone(), position);

        assert_eq!(block.content, content);
        assert!(matches!(block.block_type, BlockType::Table));
        assert_eq!(block.type_name(), "table");
    }

    #[test]
    fn test_update_content() {
        let position = create_test_position();
        let mut block = Block::paragraph("Original content".to_string(), position);
        
        let new_content = "New content with more words here".to_string();
        block.update_content(new_content.clone());

        assert_eq!(block.content, new_content);
        assert_eq!(block.metadata.word_count, 6);
        assert_eq!(block.metadata.character_count, new_content.len());
    }

    #[test]
    fn test_can_drag() {
        let position = create_test_position();
        let block = Block::paragraph("Test".to_string(), position);
        assert!(block.can_drag());
    }

    #[test]
    fn test_is_collapsible() {
        let position = create_test_position();
        let heading = Block::heading(1, "Heading".to_string(), position.clone());
        let paragraph = Block::paragraph("Paragraph".to_string(), position);

        assert!(heading.is_collapsible());
        assert!(!paragraph.is_collapsible());
    }

    #[test]
    fn test_block_position() {
        let position = BlockPosition {
            start_line: 5,
            end_line: 10,
            start_offset: 50,
            end_offset: 100,
            order_index: 3,
        };

        assert_eq!(position.start_line, 5);
        assert_eq!(position.end_line, 10);
        assert_eq!(position.start_offset, 50);
        assert_eq!(position.end_offset, 100);
        assert_eq!(position.order_index, 3);
    }

    #[test]
    fn test_block_type_matches() {
        let position = create_test_position();
        
        // 各ブロックタイプのマッチングテスト
        let heading = Block::heading(3, "H3".to_string(), position.clone());
        if let BlockType::Heading { level } = heading.block_type {
            assert_eq!(level, 3);
        }

        let list = Block::list(true, "1. Item".to_string(), position.clone());
        if let BlockType::List { ordered } = list.block_type {
            assert!(ordered);
        }

        let code = Block::code_block(None, "code".to_string(), position.clone());
        if let BlockType::CodeBlock { language } = code.block_type {
            assert!(language.is_none());
        }
    }
}