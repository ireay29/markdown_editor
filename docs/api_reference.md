# APIリファレンス (API Reference)

## 1. 目的 (Purpose)
このドキュメントは、Markdownエディターのバックエンドで提供されるTauriコマンド（API）の機能、引数、戻り値、および発生しうるエラーについて詳細に記述することを目的としています。これにより、フロントエンド開発者がこれらのAPIを正確かつ効率的に利用できるようになります。

## 2. 概要 (Overview)
本Markdownエディターは、Tauriフレームワークを利用して、Rustで実装されたバックエンドとTypeScript/Reactで実装されたフロントエンドが連携しています。フロントエンドは、Tauriが提供する`invoke`メカニズムを通じて、以下のRustコマンドを呼び出すことができます。

## 3. Tauri コマンド一覧 (List of Tauri Commands)

### 3.1. `greet`
- **説明**: テスト用のシンプルなコマンド。指定された名前に挨拶を返します。
- **引数**:
    - `name: String` - 挨拶の対象となる名前。
- **戻り値**: `String` - "Hello, {name}! You've been greeted from Rust!" 形式の挨拶メッセージ。
- **エラー**: なし

### 3.2. `read_file`
- **説明**: 指定されたパスのファイルを読み込み、その内容とファイル情報を返します。
- **引数**:
    - `path: String` - 読み込むファイルの絶対パス。
- **戻り値**: `AppResult<FileReadResult>`
    - `FileReadResult`:
        - `content: String` - ファイルの内容。
        - `file_info: FileInfo` - ファイル名、パス、サイズ、読み取り専用フラグなどの情報。
        - `encoding: String` - ファイルのエンコーディング（例: "UTF-8"）。
- **エラー**:
    - `AppError::FileNotFound`: 指定されたパスにファイルが存在しない場合。
    - `AppError::IoError`: ファイル読み込み中のI/Oエラー。
    - `AppError::PathValidation`: パスが無効な場合。

### 3.3. `save_file`
- **説明**: 指定されたパスにファイルの内容を保存します。ディレクトリが存在しない場合は作成されます。
- **引数**:
    - `path: String` - 保存するファイルの絶対パス。
    - `content: String` - ファイルに書き込む内容。
- **戻り値**: `AppResult<SaveResult>`
    - `SaveResult`:
        - `success: bool` - 保存が成功したか。
        - `path: String` - 保存されたファイルのパス。
        - `bytes_written: usize` - 書き込まれたバイト数。
- **エラー**:
    - `AppError::IoError`: ファイル書き込み中のI/Oエラー。
    - `AppError::PathValidation`: パスが無効な場合。

### 3.4. `select_file`
- **説明**: ファイル選択ダイアログを表示し、ユーザーが選択したファイルのパスを返します。Tauri v2のダイアログAPIが実装され次第、機能が提供されます。
- **引数**: なし
- **戻り値**: `AppResult<Option<String>>` - 選択されたファイルのパス。キャンセルされた場合は `None`。
- **エラー**: なし (現状は常に `None` を返す)

### 3.5. `select_save_path`
- **説明**: 保存先選択ダイアログを表示し、ユーザーが選択したパスを返します。Tauri v2のダイアログAPIが実装され次第、機能が提供されます。
- **引数**: なし
- **戻り値**: `AppResult<Option<String>>` - 選択された保存パス。キャンセルされた場合は `None`。
- **エラー**: なし (現状は常に `None` を返す)

### 3.6. `get_app_config`
- **説明**: アプリケーションの設定を読み込み、返します。
- **引数**: なし
- **戻り値**: `AppResult<crate::utils::config::AppConfig>` - アプリケーション設定オブジェクト。
- **エラー**:
    - `AppError::ConfigError`: 設定ファイルの読み込みまたはパースに失敗した場合。

### 3.7. `save_app_config`
- **説明**: アプリケーションの設定を保存します。
- **引数**:
    - `config: crate::utils::config::AppConfig` - 保存するアプリケーション設定オブジェクト。
- **戻り値**: `AppResult<bool>` - 保存が成功した場合は `true`。
- **エラー**:
    - `AppError::ConfigError`: 設定ファイルの書き込みに失敗した場合。

### 3.8. `parse_markdown`
- **説明**: Markdownコンテンツを解析し、ブロック、アウトライン、構文エラー、およびメタデータを返します。キャッシュ機能付き。
- **引数**:
    - `content: String` - 解析するMarkdownコンテンツ。
- **戻り値**: `AppResult<ParseResult>`
    - `ParseResult`:
        - `blocks: Vec<Block>` - 解析されたMarkdownブロックのリスト。
        - `outline: Vec<HeadingNode>` - ドキュメントのアウトライン構造。
        - `syntax_errors: Vec<SyntaxError>` - 検出された構文エラーのリスト。
        - `metadata: ParseMetadata` - 解析時間、ブロック数、単語数などのメタデータ。
- **エラー**:
    - `AppError::ParseError`: Markdown解析中にエラーが発生した場合。

### 3.9. `highlight_code_block`
- **説明**: 指定されたコードブロックにシンタックスハイライトを適用し、HTML形式で返します。
- **引数**:
    - `code: String` - ハイライトするコード文字列。
    - `language: Option<String>` - コードの言語（例: "rust", "typescript"）。指定しない場合は自動検出を試みます。
- **戻り値**: `AppResult<SyntaxHighlightResult>`
    - `SyntaxHighlightResult`:
        - `highlighted_html: String` - ハイライトされたHTML文字列。
        - `detected_language: String` - 検出された言語名。
        - `theme_name: String` - 使用されたテーマ名。
- **エラー**:
    - `AppError::ParseError`: ハイライト処理中にエラーが発生した場合。

### 3.10. `get_supported_languages`
- **説明**: シンタックスハイライトでサポートされている言語の一覧を返します。
- **引数**: なし
- **戻り値**: `AppResult<Vec<String>>` - サポートされている言語名のリスト。
- **エラー**: なし

### 3.11. `get_available_themes`
- **説明**: 利用可能なシンタックスハイライトテーマの一覧を返します。
- **引数**: なし
- **戻り値**: `AppResult<Vec<String>>` - 利用可能なテーマ名のリスト。
- **エラー**: なし

### 3.12. `highlight_markdown_content`
- **説明**: Markdownコンテンツ全体にシンタックスハイライトを適用し、HTML形式で返します。コードブロックは個別にハイライトされます。
- **引数**:
    - `content: String` - ハイライトするMarkdownコンテンツ。
- **戻り値**: `AppResult<String>` - ハイライトされたHTMLコンテンツ。
- **エラー**:
    - `AppError::ParseError`: ハイライト処理中にエラーが発生した場合。

### 3.13. `reorder_blocks`
- **説明**: Markdownブロックの順序を変更し、再構築されたMarkdownテキストと新しいブロックリストを返します。
- **引数**:
    - `original_content: String` - 変更前のMarkdownコンテンツ。
    - `new_block_order: Vec<String>` - ブロックIDの新しい順序を示すリスト。
- **戻り値**: `AppResult<BlockReorderResult>`
    - `BlockReorderResult`:
        - `new_content: String` - 順序変更後に再構築されたMarkdownコンテンツ。
        - `reordered_blocks: Vec<Block>` - 順序変更後のブロックリスト。
        - `change_count: usize` - 変更されたブロックの数。
- **エラー**:
    - `AppError::ParseError`: Markdown解析中にエラーが発生した場合。

### 3.14. `delete_block`
- **説明**: 指定されたIDのMarkdownブロックを削除し、更新されたブロックリストを返します。
- **引数**:
    - `content: String` - 変更前のMarkdownコンテンツ。
    - `block_id: String` - 削除するブロックのID。
- **戻り値**: `AppResult<BlockOperationResult>`
    - `BlockOperationResult`:
        - `success: bool` - 削除が成功したか。
        - `updated_blocks: Vec<Block>` - 更新されたブロックリスト。
        - `message: String` - 操作結果に関するメッセージ。
- **エラー**:
    - `AppError::ParseError`: Markdown解析中にエラーが発生した場合。

### 3.15. `duplicate_block`
- **説明**: 指定されたIDのMarkdownブロックを複製し、更新されたブロックリストを返します。
- **引数**:
    - `content: String` - 変更前のMarkdownコンテンツ。
    - `block_id: String` - 複製するブロックのID。
- **戻り値**: `AppResult<BlockOperationResult>`
    - `BlockOperationResult`:
        - `success: bool` - 複製が成功したか。
        - `updated_blocks: Vec<Block>` - 更新されたブロックリスト。
        - `message: String` - 操作結果に関するメッセージ。
- **エラー**:
    - `AppError::ParseError`: Markdown解析中にエラーが発生した場合。
