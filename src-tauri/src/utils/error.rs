use serde::Serialize;
use thiserror::Error;

/// アプリケーション全体で使用するエラー型
#[derive(Debug, Error, Serialize)]
pub enum AppError {
    #[error("ファイルが見つかりません: {path}")]
    FileNotFound { path: String },

    #[error("ファイルへのアクセス権限がありません: {path}")]
    PermissionDenied { path: String },

    #[error("行 {line} でパースエラーが発生しました: {message}")]
    ParseError { line: usize, message: String },

    #[error("IO エラー: {0}")]
    IoError(String),

    #[error("不正な入力: {message}")]
    InvalidInput { message: String },

    #[error("内部エラー: {message}")]
    InternalError { message: String },

    #[error("設定エラー: {message}")]
    ConfigError { message: String },
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        match error.kind() {
            std::io::ErrorKind::NotFound => AppError::FileNotFound {
                path: "Unknown".to_string(),
            },
            std::io::ErrorKind::PermissionDenied => AppError::PermissionDenied {
                path: "Unknown".to_string(),
            },
            _ => AppError::IoError(error.to_string()),
        }
    }
}

impl From<serde_json::Error> for AppError {
    fn from(error: serde_json::Error) -> Self {
        AppError::ParseError {
            line: error.line(),
            message: error.to_string(),
        }
    }
}

/// Result型のエイリアス
pub type AppResult<T> = Result<T, AppError>;

/// パス検証用のヘルパー関数
pub fn validate_file_path(path: &str) -> AppResult<()> {
    if path.contains("..") || path.contains("//") {
        return Err(AppError::InvalidInput {
            message: "不正なファイルパスです".to_string(),
        });
    }
    Ok(())
}