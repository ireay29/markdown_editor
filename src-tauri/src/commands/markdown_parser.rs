use serde::Serialize;
use tauri::command;
use crate::utils::error::AppResult;
use crate::core::models::{Block, BlockPosition, BlockType};
use pulldown_cmark::{Parser, Event, Tag, TagEnd, CowStr, Options};
use syntect::highlighting::ThemeSet;
use syntect::parsing::SyntaxSet;
use syntect::html::highlighted_html_for_string;
use std::collections::HashMap;
use std::sync::LazyLock;

#[derive(Debug, Clone, Serialize)]
pub struct ParseResult {
    pub blocks: Vec<Block>,
    pub outline: Vec<HeadingNode>,
    pub syntax_errors: Vec<SyntaxError>,
    pub metadata: ParseMetadata,
}

#[derive(Debug, Clone, Serialize)]
pub struct HeadingNode {
    pub id: String,
    pub level: u8,
    pub title: String,
    pub line: usize,
    pub start_offset: usize,
    pub end_offset: usize,
    pub children: Vec<HeadingNode>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SyntaxError {
    pub id: String,
    pub error_type: String,
    pub message: String,
    pub line: usize,
    pub column: usize,
    pub severity: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ParseMetadata {
    pub parse_time_ms: u64,
    pub block_count: usize,
    pub word_count: usize,
    pub character_count: usize,
    pub line_count: usize,
    pub gfm_features: Vec<String>,
    pub cache_hit: bool,
}

// キャッシュ用の構造体
#[derive(Debug, Clone)]
struct ParseCache {
    content_hash: u64,
    result: ParseResult,
}

// グローバルキャッシュ（実際のアプリケーションではもっと洗練された解決策を使用）
static PARSE_CACHE: LazyLock<std::sync::RwLock<HashMap<u64, ParseCache>>> = LazyLock::new(|| {
    std::sync::RwLock::new(HashMap::new())
});

// Syntectの初期化
static SYNTAX_SET: LazyLock<SyntaxSet> = LazyLock::new(SyntaxSet::load_defaults_newlines);
static THEME_SET: LazyLock<ThemeSet> = LazyLock::new(ThemeSet::load_defaults);


/// Markdownコンテンツを解析する（キャッシュ機能付き）
#[command]
pub async fn parse_markdown(content: String) -> AppResult<ParseResult> {
    let start_time = std::time::Instant::now();
    
    // コンテンツのハッシュ値を計算
    let content_hash = calculate_hash(&content);
    
    // キャッシュをチェック
    if let Ok(cache) = PARSE_CACHE.read() {
        if let Some(cached_result) = cache.get(&content_hash) {
            let mut result = cached_result.result.clone();
            result.metadata.cache_hit = true;
            result.metadata.parse_time_ms = start_time.elapsed().as_millis() as u64;
            return Ok(result);
        }
    }
    
    // 基本的な統計情報を計算
    let character_count = content.len();
    let line_count = content.lines().count();
    let word_count = content.split_whitespace().count();

    // pulldown-cmarkを使用した解析
    let blocks = extract_markdown_blocks(&content)?;
    let outline = extract_outline_advanced(&content)?;
    let syntax_errors = detect_syntax_errors(&content);
    let gfm_features = detect_gfm_features(&content);

    let parse_time = start_time.elapsed().as_millis() as u64;
    let block_count = blocks.len();

    let result = ParseResult {
        blocks,
        outline,
        syntax_errors,
        metadata: ParseMetadata {
            parse_time_ms: parse_time,
            block_count,
            word_count,
            character_count,
            line_count,
            gfm_features,
            cache_hit: false,
        },
    };

    // キャッシュに保存（最大100エントリまで）
    if let Ok(mut cache) = PARSE_CACHE.write() {
        if cache.len() >= 100 {
            // 古いエントリを削除（簡単な実装）
            let oldest_key = *cache.keys().next().unwrap();
            cache.remove(&oldest_key);
        }
        cache.insert(content_hash, ParseCache {
            content_hash,
            result: result.clone(),
        });
    }

    Ok(result)
}

/// ハッシュ値計算（簡単な実装）
fn calculate_hash(content: &str) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let mut hasher = DefaultHasher::new();
    content.hash(&mut hasher);
    hasher.finish()
}

/// GFM機能を検出
fn detect_gfm_features(content: &str) -> Vec<String> {
    let mut features = Vec::new();
    
    // テーブル
    if content.lines().any(|line| line.contains('|') && line.matches('|').count() >= 2) {
        features.push("tables".to_string());
    }
    
    // 取り消し線
    if content.contains("~~") {
        features.push("strikethrough".to_string());
    }
    
    // タスクリスト
    if content.contains("- [ ]") || content.contains("- [x]") {
        features.push("task_lists".to_string());
    }
    
    // フェンスコードブロック
    if content.contains("```") {
        features.push("fenced_code_blocks".to_string());
    }
    
    // オートリンク
    if content.contains("http://") || content.contains("https://") {
        features.push("autolinks".to_string());
    }
    
    features
}

/// pulldown-cmarkを使用したブロック抽出
fn extract_markdown_blocks(content: &str) -> AppResult<Vec<Block>> {
    let mut blocks = Vec::new();
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    
    let parser = Parser::new_ext(content, options);
    let mut current_block_start = 0;
    let mut current_block_text = String::new();
    let mut in_code_block = false;
    let mut code_block_lang: Option<String> = None;
    let mut list_depth = 0;
    let mut block_order = 0;
    
    for (event, range) in parser.into_offset_iter() {
        match event {
            Event::Start(tag) => {
                match tag {
                    Tag::Heading { level, .. } => {
                        current_block_start = range.start;
                        current_block_text.clear();
                    }
                    Tag::Paragraph => {
                        current_block_start = range.start;
                        current_block_text.clear();
                    }
                    Tag::CodeBlock(lang) => {
                        in_code_block = true;
                        current_block_start = range.start;
                        current_block_text.clear();
                        code_block_lang = match lang {
                            pulldown_cmark::CodeBlockKind::Fenced(lang_str) => {
                                let lang = lang_str.as_ref();
                                if lang.is_empty() { None } else { Some(lang.to_string()) }
                            },
                            pulldown_cmark::CodeBlockKind::Indented => None,
                        };
                    }
                    Tag::List(_) => {
                        list_depth += 1;
                        current_block_start = range.start;
                        current_block_text.clear();
                    }
                    Tag::BlockQuote(_) => {
                        current_block_start = range.start;
                        current_block_text.clear();
                    }
                    Tag::Table(_) => {
                        current_block_start = range.start;
                        current_block_text.clear();
                    }
                    _ => {}
                }
            }
            Event::End(TagEnd::Heading(level)) => {
                let position = create_block_position(content, current_block_start, range.end, block_order);
                blocks.push(Block::heading(level as u8, current_block_text.trim().to_string(), position));
                block_order += 1;
            }
            Event::End(TagEnd::Paragraph) => {
                if !current_block_text.trim().is_empty() && list_depth == 0 {
                    let position = create_block_position(content, current_block_start, range.end, block_order);
                    blocks.push(Block::paragraph(current_block_text.trim().to_string(), position));
                    block_order += 1;
                }
            }
            Event::End(TagEnd::CodeBlock) => {
                in_code_block = false;
                let position = create_block_position(content, current_block_start, range.end, block_order);
                blocks.push(Block::code_block(code_block_lang.clone(), current_block_text.clone(), position));
                code_block_lang = None;
                block_order += 1;
            }
            Event::End(TagEnd::List(_)) => {
                list_depth -= 1;
                if list_depth == 0 && !current_block_text.trim().is_empty() {
                    let position = create_block_position(content, current_block_start, range.end, block_order);
                    blocks.push(Block::list(false, current_block_text.trim().to_string(), position));
                    block_order += 1;
                }
            }
            Event::End(TagEnd::BlockQuote) => {
                let position = create_block_position(content, current_block_start, range.end, block_order);
                blocks.push(Block::quote(current_block_text.trim().to_string(), position));
                block_order += 1;
            }
            Event::End(TagEnd::Table) => {
                let position = create_block_position(content, current_block_start, range.end, block_order);
                blocks.push(Block::table(current_block_text.trim().to_string(), position));
                block_order += 1;
            }
            Event::Text(text) => {
                current_block_text.push_str(&text);
            }
            Event::Code(code) => {
                current_block_text.push('`');
                current_block_text.push_str(&code);
                current_block_text.push('`');
            }
            _ => {}
        }
    }
    
    Ok(blocks)
}

/// ブロック位置情報を作成
fn create_block_position(content: &str, start_offset: usize, end_offset: usize, order_index: usize) -> BlockPosition {
    let lines_before_start = content[..start_offset].matches('\n').count();
    let lines_before_end = content[..end_offset].matches('\n').count();
    
    BlockPosition {
        start_line: lines_before_start,
        end_line: lines_before_end,
        start_offset,
        end_offset,
        order_index,
    }
}


/// pulldown-cmarkを使用した高度なアウトライン抽出
fn extract_outline_advanced(content: &str) -> AppResult<Vec<HeadingNode>> {
    let mut headings = Vec::new();
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    
    let parser = Parser::new_ext(content, options);
    let mut current_heading_text = String::new();
    let mut current_heading_level = 0;
    let mut current_heading_start = 0;
    
    for (event, range) in parser.into_offset_iter() {
        match event {
            Event::Start(Tag::Heading { level, .. }) => {
                current_heading_level = level as u8;
                current_heading_text.clear();
                current_heading_start = range.start;
            }
            Event::End(TagEnd::Heading(_)) => {
                if !current_heading_text.trim().is_empty() {
                    let line_number = content[..current_heading_start].matches('\n').count();
                    headings.push(HeadingNode {
                        id: format!("heading-{}-{}", line_number, current_heading_level),
                        level: current_heading_level,
                        title: current_heading_text.trim().to_string(),
                        line: line_number,
                        start_offset: current_heading_start,
                        end_offset: 0, // Calculated later
                        children: Vec::new(),
                    });
                }
            }
            Event::Text(text) => {
                if current_heading_level > 0 {
                    current_heading_text.push_str(&text);
                }
            }
            Event::Code(code) => {
                if current_heading_level > 0 {
                    current_heading_text.push_str(&code);
                }
            }
            _ => {}
        }
    }
    
    // Calculate section ranges before building hierarchy
    calculate_section_ranges(&mut headings, content.len());
    
    // 階層構造を構築
    build_heading_hierarchy(headings)
}

/// セクションの範囲（開始・終了オフセット）を計算
fn calculate_section_ranges(headings: &mut Vec<HeadingNode>, content_len: usize) {
    for i in 0..headings.len() {
        let current_level = headings[i].level;
        let mut end = content_len;
        
        // Find the next heading with same or higher (numerically smaller) level
        for j in (i + 1)..headings.len() {
            if headings[j].level <= current_level {
                end = headings[j].start_offset;
                break;
            }
        }
        
        headings[i].end_offset = end;
    }
}

/// 見出しの階層構造を構築
fn build_heading_hierarchy(mut headings: Vec<HeadingNode>) -> AppResult<Vec<HeadingNode>> {
    let mut stack: Vec<HeadingNode> = Vec::new();
    let mut result = Vec::new();
    
    for heading in headings.drain(..) {
        // スタックから現在の見出しより低いレベルのものを取り除く
        while let Some(last) = stack.last() {
            if last.level >= heading.level {
                let popped = stack.pop().unwrap();
                if let Some(parent) = stack.last_mut() {
                    parent.children.push(popped);
                } else {
                    result.push(popped);
                }
            } else {
                break;
            }
        }
        
        stack.push(heading);
    }
    
    // 残りのスタックをすべて処理
    while let Some(heading) = stack.pop() {
        if let Some(parent) = stack.last_mut() {
            parent.children.push(heading);
        } else {
            result.push(heading);
        }
    }
    
    Ok(result)
}


/// シンタックスハイライト結果
#[derive(Debug, Clone, Serialize)]
pub struct SyntaxHighlightResult {
    pub highlighted_html: String,
    pub detected_language: String,
    pub theme_name: String,
}

/// コードブロックのシンタックスハイライトを実行
#[command]
pub async fn highlight_code_block(code: String, language: Option<String>) -> AppResult<SyntaxHighlightResult> {
    let syntax_ref = if let Some(lang) = &language {
        SYNTAX_SET.find_syntax_by_token(lang)
            .or_else(|| SYNTAX_SET.find_syntax_by_extension(lang))
            .unwrap_or_else(|| SYNTAX_SET.find_syntax_plain_text())
    } else {
        // 言語が指定されていない場合は自動検出を試行
        SYNTAX_SET.find_syntax_by_first_line(&code)
            .unwrap_or_else(|| SYNTAX_SET.find_syntax_plain_text())
    };

    let theme = &THEME_SET.themes["base16-ocean.dark"];
    
    let highlighted_html = highlighted_html_for_string(
        &code,
        &SYNTAX_SET,
        syntax_ref,
        theme,
    ).map_err(|e| crate::utils::error::AppError::ParseError {
        line: 0,
        message: format!("Syntax highlighting failed: {}", e),
    })?;

    Ok(SyntaxHighlightResult {
        highlighted_html,
        detected_language: syntax_ref.name.to_string(),
        theme_name: "base16-ocean.dark".to_string(),
    })
}

/// 利用可能な言語の一覧を取得
#[command]
pub async fn get_supported_languages() -> AppResult<Vec<String>> {
    let languages = SYNTAX_SET
        .syntaxes()
        .iter()
        .flat_map(|syntax| syntax.file_extensions.iter())
        .map(|ext| ext.to_string())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();
    
    Ok(languages)
}

/// 利用可能なテーマの一覧を取得
#[command] 
pub async fn get_available_themes() -> AppResult<Vec<String>> {
    let themes = THEME_SET
        .themes
        .keys()
        .map(|name| name.to_string())
        .collect();
    
    Ok(themes)
}

/// Markdownコンテンツ全体にシンタックスハイライトを適用
#[command]
pub async fn highlight_markdown_content(content: String) -> AppResult<String> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    
    let parser = Parser::new_ext(&content, options);
    let mut highlighted_content = String::new();
    let mut in_code_block = false;
    let mut code_block_content = String::new();
    let mut code_block_lang: Option<String> = None;
    
    for event in parser {
        match event {
            Event::Start(Tag::CodeBlock(lang)) => {
                in_code_block = true;
                code_block_content.clear();
                code_block_lang = match lang {
                    pulldown_cmark::CodeBlockKind::Fenced(lang_str) => {
                        let lang = lang_str.as_ref();
                        if lang.is_empty() { None } else { Some(lang.to_string()) }
                    },
                    pulldown_cmark::CodeBlockKind::Indented => None,
                };
            }
            Event::End(TagEnd::CodeBlock) => {
                in_code_block = false;
                // シンタックスハイライトを適用
                match highlight_code_block(code_block_content.clone(), code_block_lang.clone()).await {
                    Ok(result) => {
                        highlighted_content.push_str(&format!(
                            "<pre class=\"highlight\"><code class=\"language-{}\">{}</code></pre>",
                            result.detected_language.to_lowercase(),
                            result.highlighted_html
                        ));
                    }
                    Err(_) => {
                        // ハイライトに失敗した場合はプレーンテキストとして表示
                        highlighted_content.push_str(&format!(
                            "<pre><code>{}</code></pre>",
                            html_escape::encode_text(&code_block_content)
                        ));
                    }
                }
            }
            Event::Text(text) => {
                if in_code_block {
                    code_block_content.push_str(&text);
                } else {
                    highlighted_content.push_str(&html_escape::encode_text(&text));
                }
            }
            _ => {
                // 他のイベントはそのまま追加（簡略化）
                // 実際の実装では、すべてのMarkdown要素を適切にHTMLに変換する必要がある
            }
        }
    }
    
    Ok(highlighted_content)
}

/// ブロック順序変更結果
#[derive(Debug, Clone, Serialize)]
pub struct BlockReorderResult {
    pub new_content: String,
    pub reordered_blocks: Vec<Block>,
    pub change_count: usize,
}

/// ブロックの順序を変更してMarkdownテキストを再構築
#[command]
pub async fn reorder_blocks(
    original_content: String,
    new_block_order: Vec<String>, // ブロックIDの新しい順序
) -> AppResult<BlockReorderResult> {
    // 元のコンテンツからブロックを抽出
    let original_blocks = extract_markdown_blocks(&original_content)?;
    
    // IDでブロックをマッピング
    let mut block_map: HashMap<String, Block> = HashMap::new();
    for block in &original_blocks {
        block_map.insert(block.id.clone(), block.clone());
    }
    
    // 新しい順序でブロックを並び替え
    let mut reordered_blocks = Vec::new();
    let mut change_count = 0;
    
    for (new_index, block_id) in new_block_order.iter().enumerate() {
        if let Some(mut block) = block_map.get(block_id).cloned() {
            // 新しいorder_indexを設定
            if block.position.order_index != new_index {
                change_count += 1;
            }
            block.position.order_index = new_index;
            reordered_blocks.push(block);
        }
    }
    
    // 並び替えたブロックからMarkdownテキストを再構築
    let new_content = reconstruct_markdown_from_blocks(&reordered_blocks);
    
    Ok(BlockReorderResult {
        new_content,
        reordered_blocks,
        change_count,
    })
}

/// ブロック配列からMarkdownテキストを再構築
fn reconstruct_markdown_from_blocks(blocks: &[Block]) -> String {
    let mut content = String::new();
    
    for (i, block) in blocks.iter().enumerate() {
        // ブロック間に適切な改行を追加
        if i > 0 {
            content.push('\n');
            // 見出しや特定のブロックタイプの前には追加の改行
            match block.block_type {
                BlockType::Heading { .. } => content.push('\n'),
                BlockType::CodeBlock { .. } => content.push('\n'),
                BlockType::Quote => content.push('\n'),
                BlockType::Table => content.push('\n'),
                _ => {}
            }
        }
        
        // ブロックタイプに応じてマークダウンフォーマットを適用
        match &block.block_type {
            BlockType::Heading { level } => {
                content.push_str(&"#".repeat(*level as usize));
                content.push(' ');
                content.push_str(&block.content);
            }
            BlockType::CodeBlock { language } => {
                content.push_str("```");
                if let Some(ref lang) = language {
                    content.push_str(lang);
                }
                content.push('\n');
                content.push_str(&block.content);
                content.push('\n');
                content.push_str("```");
            }
            BlockType::Quote => {
                for line in block.content.lines() {
                    content.push_str("> ");
                    content.push_str(line);
                    content.push('\n');
                }
                // 最後の改行を削除
                content.pop();
            }
            BlockType::List { ordered } => {
                for (line_index, line) in block.content.lines().enumerate() {
                    if *ordered {
                        content.push_str(&format!("{}. {}", line_index + 1, line));
                    } else {
                        content.push_str(&format!("- {}", line));
                    }
                    content.push('\n');
                }
                // 最後の改行を削除
                content.pop();
            }
            _ => {
                content.push_str(&block.content);
            }
        }
    }
    
    content
}

/// ブロック管理操作結果
#[derive(Debug, Clone, Serialize)]
pub struct BlockOperationResult {
    pub success: bool,
    pub updated_blocks: Vec<Block>,
    pub message: String,
    pub new_content: String,
}

/// ブロックを削除
#[command]
pub async fn delete_block(
    content: String,
    block_id: String,
) -> AppResult<BlockOperationResult> {
    let mut blocks = extract_markdown_blocks(&content)?;
    
    // 指定されたIDのブロックを削除
    let original_count = blocks.len();
    blocks.retain(|block| block.id != block_id);
    
    if blocks.len() == original_count {
        return Ok(BlockOperationResult {
            success: false,
            updated_blocks: blocks,
            message: "Block not found".to_string(),
            new_content: content.clone(),
        });
    }
    
    // order_indexを再計算
    for (i, block) in blocks.iter_mut().enumerate() {
        block.position.order_index = i;
    }
    
    Ok(BlockOperationResult {
        success: true,
        updated_blocks: blocks,
        message: "Block deleted successfully".to_string(),
        new_content: content.clone(), // WARNING: delete_block does not yet perform string manipulation
    })
}

/// ブロックを複製
#[command] 
pub async fn duplicate_block(
    content: String,
    block_id: String,
) -> AppResult<BlockOperationResult> {
    let mut blocks = extract_markdown_blocks(&content)?;
    
    // 指定されたIDのブロックを見つけて複製
    let mut found_block = None;
    let mut insert_index = 0;
    
    for (i, block) in blocks.iter().enumerate() {
        if block.id == block_id {
            found_block = Some(block.clone());
            insert_index = i + 1;
            break;
        }
    }
    
    if let Some(mut duplicate) = found_block {
        // 新しいIDを生成
        duplicate.id = uuid::Uuid::new_v4().to_string();
        duplicate.position.order_index = insert_index;
        
        // 複製を挿入
        blocks.insert(insert_index, duplicate);
        
        // 挿入後のブロックのorder_indexを再計算
        for (i, block) in blocks.iter_mut().enumerate() {
            block.position.order_index = i;
        }
        
        Ok(BlockOperationResult {
            success: true,
            updated_blocks: blocks,
            message: "Block duplicated successfully".to_string(),
            new_content: content.clone(), // WARNING: duplicate_block does not yet perform string manipulation
        })
    } else {
        Ok(BlockOperationResult {
            success: false,
            updated_blocks: blocks,
            message: "Block not found".to_string(),
            new_content: content.clone(),
        })
    }
}

/// セクションを移動（生の文字列操作）
#[command]
pub async fn move_section(
    content: String,
    section_id: String,
    target_index: usize,
) -> AppResult<BlockOperationResult> {
    // 1. Parse blocks to get IDs and Levels
    let blocks = extract_markdown_blocks(&content)?;
    
    // 2. Find target block
    let target_pos = blocks.iter().position(|b| b.id == section_id);
    
    if let Some(idx) = target_pos {
        let target_block = &blocks[idx];
        
        // Ensure it is a heading (or treat any block as section starter?)
        // User said "Start with Heading 1, 2...", so it must be heading.
        let (target_level, _target_title) = match &target_block.block_type {
            BlockType::Heading { level, .. } => (*level, target_block.content.clone()),
            _ => {
                // Not a heading, cannot move as section?
                return Ok(BlockOperationResult {
                    success: false,
                    updated_blocks: blocks,
                    message: "Target is not a heading".to_string(),
                    new_content: content.clone(),
                });
            }
        };
        
        // 3. Identify Siblings (Headers of same level, share same parent context)
        // Parent context means: No header with level < target_level between them.
        
        // Scan backwards to find "start of sibling group" (first sibling after a parent)
        // Scan forwards to find "end of sibling group"
        
        let mut group_start = 0;
        let mut group_end = blocks.len();
        
        // Find start: Look back for any header with level < target_level
        for i in (0..idx).rev() {
            if let BlockType::Heading { level, .. } = blocks[i].block_type {
                if level < target_level {
                    // Found parent container start
                    // The sibling group starts AFTER this parent header
                    // Wait, actually the sibling group starts at the next block?
                    // No, the next block might be content. 
                    // We are looking for SIBLING HEADERS.
                    // The "scope" is constrained by this parent.
                    group_start = i + 1;
                    break;
                }
            }
        }
        
        // Find end: Look forward for any header with level < target_level
        for i in (idx + 1)..blocks.len() {
             if let BlockType::Heading { level, .. } = blocks[i].block_type {
                if level < target_level {
                    group_end = i;
                    break;
                }
            }
        }
        
        // Now collect all siblings (same level headers) within [group_start, group_end)
        let mut siblings: Vec<(usize, &Block)> = Vec::new(); // (index_in_blocks, Block)
        for i in group_start..group_end {
            if let BlockType::Heading { level, .. } = blocks[i].block_type {
                if level == target_level {
                    siblings.push((i, &blocks[i]));
                }
            }
        }
        
        // Verify target is in siblings
        let current_sibling_index = siblings.iter().position(|(_, b)| b.id == section_id);
        
        if let Some(curr_idx) = current_sibling_index {
            if target_index >= siblings.len() {
                 return Ok(BlockOperationResult {
                    success: false,
                    updated_blocks: blocks,
                    message: "Target index out of bounds".to_string(),
                    new_content: content.clone(),
                });
            }
            
            // 4. Calculate ranges to manipulate
            // We need to move the WHOLE SECTION of the target.
            // Section = [TargetHeader, NextHeaderOrScopeEnd)
            
            let calculate_section_end = |block_idx: usize, scope_end: usize| -> usize {
                // Find next header with level <= target_level
                // Actually within the scope, we stop at next sibling (same level) or scope end (lower level).
                // But nested headers (higher level) are included.
                for k in (block_idx + 1)..scope_end {
                    if let BlockType::Heading { level, .. } = blocks[k].block_type {
                        if level <= target_level {
                            return blocks[k].position.start_offset;
                        }
                    }
                }
                // If we hit scope_end, we need the end offset of the last block in scope.
                // Wait, scope_end refers to the start of the next parent/higher section.
                // OR it is blocks.len().
                if scope_end < blocks.len() {
                    return blocks[scope_end].position.start_offset;
                } else {
                    return content.len(); // content.len() might be safer? Or last block's end.
                }
            };
            
            // Get range for TARGET
            let target_block_idx = siblings[curr_idx].0;
            let target_start_offset = blocks[target_block_idx].position.start_offset;
            let target_end_offset = calculate_section_end(target_block_idx, group_end);
            
            let target_text = &content[target_start_offset..target_end_offset];
            
            // Construct new content
            let mut new_content = String::new();
            
            // Where to insert?
            // If moving DOWN (0->2): Insert AFTER the END of sibling[2]'s section?
            // Or replace logic?
            // "Insert before sibling[target_index]" (if moving up) or "Insert after sibling[target_index]"?
            // Standard approach: Removing target, then inserting it at index.
            
            // If I remove target, the indices change.
            // Let's use simple logic:
            // Sibling 0, Sibling 1, Sibling 2...
            // If I move Sib 0 to Pos 2 (make it 3rd):
            // Order becomes: Sib 1, Sib 2, Sib 0.
            // So I insert after Sib 2.
            
            // If I move Sib 2 to Pos 0:
            // Order becomes: Sib 2, Sib 0, Sib 1.
            // I insert before Sib 0.
            
            // Logic:
            // 1. Identify Insertion Point.
            //    If curr < target: We want to trigger insert AFTER sibling[target].
            //    If curr > target: We want to trigger insert BEFORE sibling[target].
            //    But wait, sibling[target] is the OLD sibling at that index.
            
            // Refined Logic:
            // Target Index IS the destination index in the resulting list.
            // If I move 0 -> 2:
            // The item at 2 (Old Sib 2) will shift to 1? No.
            // Old: [A, B, C]
            // Move A to 2: [B, C, A]
            // Target Index: 2.
            // I insert AFTER Old Sib 2 (C).
            
            // If I move 2 -> 0:
            // Old: [A, B, C]
            // Move C to 0: [C, A, B]
            // Target Index: 0.
            // I insert BEFORE Old Sib 0 (A).
            
            let insert_pos;
            if curr_idx < target_index {
                // Moving down, insert after the target_index sibling's section end
                let sibling_idx = siblings[target_index].0;
                let sibling_end = calculate_section_end(sibling_idx, group_end);
                insert_pos = sibling_end;
            } else {
                 // Moving up, insert before the target_index sibling's section start
                 let sibling_idx = siblings[target_index].0;
                 insert_pos = blocks[sibling_idx].position.start_offset;
            }
            
            // Construct string
            // Cases:
            // 1. Target is before InsertPos (Moving Down)
            //    [Prefix] [Target] [InBetween] [InsertPos ->] ...
            //    Result: [Prefix] [InBetween] [Target] ...
            // 2. Target is after InsertPos (Moving Up)
            //    ... [InsertPos ->] [InBetween] [Target] [Suffix]
            //    Result: ... [Target] [InBetween] [Suffix]
            
            let t_start = target_start_offset;
            let t_end = target_end_offset;
            
            if t_start < insert_pos {
                // Moving forward/down
                new_content.push_str(&content[..t_start]);
                new_content.push_str(&content[t_end..insert_pos]);
                new_content.push_str(target_text);
                new_content.push_str(&content[insert_pos..]);
            } else {
                // Moving backward/up
                new_content.push_str(&content[..insert_pos]);
                new_content.push_str(target_text);
                new_content.push_str(&content[insert_pos..t_start]);
                new_content.push_str(&content[t_end..]);
            }

            let updated_blocks = extract_markdown_blocks(&new_content)?; 
            
            return Ok(BlockOperationResult {
                success: true,
                updated_blocks,
                message: "Section moved successfully".to_string(),
                new_content,
            });
        }
    }
    
    // Not found
    let blocks = extract_markdown_blocks(&content)?;
    Ok(BlockOperationResult {
        success: false,
        updated_blocks: blocks,
        message: "Section not found".to_string(),
        new_content: content.clone(),
    })
}
/// Markdownの構文エラーを検出
fn detect_syntax_errors(content: &str) -> Vec<SyntaxError> {
    let mut errors = Vec::new();
    let lines: Vec<&str> = content.lines().collect();

    for (line_num, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        
        // 1. 未完成のマークダウンリンク
        if let Some(start) = trimmed.find('[') {
            let after_bracket = &trimmed[start + 1..];
            if let Some(close_bracket) = after_bracket.find(']') {
                let after_close = &after_bracket[close_bracket + 1..];
                if !after_close.starts_with('(') && !after_close.starts_with(':') {
                    // リンクが未完成
                    errors.push(SyntaxError {
                        id: uuid::Uuid::new_v4().to_string(),
                        error_type: "incomplete_link".to_string(),
                        message: "Incomplete link syntax: missing URL or reference".to_string(),
                        line: line_num,
                        column: start,
                        severity: "warning".to_string(),
                    });
                }
            } else if after_bracket.len() > 0 {
                // 閉じブラケットがない
                errors.push(SyntaxError {
                    id: uuid::Uuid::new_v4().to_string(),
                    error_type: "unclosed_bracket".to_string(),
                    message: "Unclosed bracket in link syntax".to_string(),
                    line: line_num,
                    column: start,
                    severity: "error".to_string(),
                });
            }
        }

        // 2. 未完成のコードブロック
        if trimmed.starts_with("```") && line_num < lines.len() - 1 {
            let mut found_closing = false;
            for (check_line_num, check_line) in lines.iter().enumerate().skip(line_num + 1) {
                if check_line.trim().starts_with("```") {
                    found_closing = true;
                    break;
                }
            }
            if !found_closing {
                errors.push(SyntaxError {
                    id: uuid::Uuid::new_v4().to_string(),
                    error_type: "unclosed_code_block".to_string(),
                    message: "Unclosed code block: missing closing ```".to_string(),
                    line: line_num,
                    column: 0,
                    severity: "error".to_string(),
                });
            }
        }

        // 3. 変数の構文エラー
        if trimmed.contains("{{") {
            let mut pos = 0;
            while let Some(start) = trimmed[pos..].find("{{") {
                let abs_start = pos + start;
                let after_open = &trimmed[abs_start + 2..];
                
                if let Some(end) = after_open.find("}}") {
                    let var_content = &after_open[..end];
                    // 変数名の検証
                    if var_content.trim().is_empty() {
                        errors.push(SyntaxError {
                            id: uuid::Uuid::new_v4().to_string(),
                            error_type: "empty_variable".to_string(),
                            message: "Empty variable name".to_string(),
                            line: line_num,
                            column: abs_start,
                            severity: "error".to_string(),
                        });
                    } else if !var_content.chars().all(|c| c.is_alphanumeric() || c.is_whitespace() || c == '_') {
                        errors.push(SyntaxError {
                            id: uuid::Uuid::new_v4().to_string(),
                            error_type: "invalid_variable_name".to_string(),
                            message: "Invalid characters in variable name".to_string(),
                            line: line_num,
                            column: abs_start,
                            severity: "warning".to_string(),
                        });
                    }
                    pos = abs_start + end + 4; // Move past this variable
                } else {
                    // 未閉の変数
                    errors.push(SyntaxError {
                        id: uuid::Uuid::new_v4().to_string(),
                        error_type: "unclosed_variable".to_string(),
                        message: "Unclosed variable syntax: missing }}".to_string(),
                        line: line_num,
                        column: abs_start,
                        severity: "error".to_string(),
                    });
                    break;
                }
            }
        }

        // 4. 表の構文チェック
        if trimmed.contains('|') && trimmed.matches('|').count() >= 2 {
            let parts: Vec<&str> = trimmed.split('|').collect();
            if parts.len() < 3 {
                errors.push(SyntaxError {
                    id: uuid::Uuid::new_v4().to_string(),
                    error_type: "invalid_table".to_string(),
                    message: "Invalid table syntax: insufficient columns".to_string(),
                    line: line_num,
                    column: 0,
                    severity: "warning".to_string(),
                });
            }
        }

        // 5. 見出しの構文チェック
        if trimmed.starts_with('#') {
            let hash_count = trimmed.chars().take_while(|&c| c == '#').count();
            if hash_count > 6 {
                errors.push(SyntaxError {
                    id: uuid::Uuid::new_v4().to_string(),
                    error_type: "invalid_heading_level".to_string(),
                    message: format!("Invalid heading level: {} (max 6)", hash_count),
                    line: line_num,
                    column: 0,
                    severity: "warning".to_string(),
                });
            } else if hash_count > 0 {
                let after_hashes = &trimmed[hash_count..];
                if !after_hashes.is_empty() && !after_hashes.starts_with(' ') {
                    errors.push(SyntaxError {
                        id: uuid::Uuid::new_v4().to_string(),
                        error_type: "missing_space_after_heading".to_string(),
                        message: "Missing space after heading hashes".to_string(),
                        line: line_num,
                        column: hash_count,
                        severity: "warning".to_string(),
                    });
                }
            }
        }
    }

    errors
}
