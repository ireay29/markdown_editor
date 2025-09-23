use serde::Serialize;
use std::path::PathBuf;
use tauri::command;
use crate::utils::error::{AppError, AppResult, validate_file_path};

#[derive(Debug, Serialize)]
pub struct FileReadResult {
    pub content: String,
    pub file_info: FileInfo,
    pub encoding: String,
}

#[derive(Debug, Serialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub readonly: bool,
}

#[derive(Debug, Serialize)]
pub struct SaveResult {
    pub success: bool,
    pub path: String,
    pub bytes_written: usize,
}

/// ファイルを読み込む
#[command]
pub async fn read_file(path: String) -> AppResult<FileReadResult> {
    validate_file_path(&path)?;
    
    let file_path = PathBuf::from(&path);
    
    if !file_path.exists() {
        return Err(AppError::FileNotFound { path });
    }

    let content = tokio::fs::read_to_string(&file_path).await?;
    let metadata = tokio::fs::metadata(&file_path).await?;
    
    let file_info = FileInfo {
        name: file_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown")
            .to_string(),
        path: path.clone(),
        size: metadata.len(),
        readonly: metadata.permissions().readonly(),
    };

    Ok(FileReadResult {
        content,
        file_info,
        encoding: "UTF-8".to_string(),
    })
}

/// ファイルを保存する
#[command]
pub async fn save_file(path: String, content: String) -> AppResult<SaveResult> {
    validate_file_path(&path)?;
    
    let file_path = PathBuf::from(&path);
    
    // ディレクトリが存在しない場合は作成
    if let Some(parent) = file_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    tokio::fs::write(&file_path, &content).await?;
    
    Ok(SaveResult {
        success: true,
        path,
        bytes_written: content.len(),
    })
}

/// ファイル選択ダイアログを表示
#[command]
pub async fn select_file() -> AppResult<Option<String>> {
    // TODO: Tauri v2のダイアログAPI実装
    Ok(None)
}

/// 保存先選択ダイアログを表示
#[command]
pub async fn select_save_path() -> AppResult<Option<String>> {
    // TODO: Tauri v2のダイアログAPI実装
    Ok(None)
}

/// アプリケーション設定を取得
#[command]
pub async fn get_app_config() -> AppResult<crate::utils::config::AppConfig> {
    crate::utils::config::AppConfig::load()
}

/// アプリケーション設定を保存
#[command]
pub async fn save_app_config(config: crate::utils::config::AppConfig) -> AppResult<bool> {
    config.save()?;
    Ok(true)
}