use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use dirs;
use crate::utils::error::{AppError, AppResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub ui: UiConfig,
    pub editor: EditorConfig,
    pub recent_files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiConfig {
    pub theme: String,
    pub sidebar_width: u32,
    pub preview_width: u32,
    pub font_size: u32,
    pub font_family: String,
    pub line_height: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorConfig {
    pub word_wrap: bool,
    pub show_line_numbers: bool,
    pub enable_syntax_highlight: bool,
    pub enable_live_preview: bool,
    pub auto_save: bool,
    pub auto_save_interval: u32,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            ui: UiConfig {
                theme: "light".to_string(),
                sidebar_width: 300,
                preview_width: 400,
                font_size: 14,
                font_family: "JetBrains Mono".to_string(),
                line_height: 1.5,
            },
            editor: EditorConfig {
                word_wrap: true,
                show_line_numbers: true,
                enable_syntax_highlight: true,
                enable_live_preview: true,
                auto_save: true,
                auto_save_interval: 5000,
            },
            recent_files: Vec::new(),
        }
    }
}

impl AppConfig {
    /// 設定ファイルのパスを取得
    pub fn config_path() -> AppResult<PathBuf> {
        let config_dir = dirs::config_dir()
            .ok_or(AppError::ConfigError {
                message: "設定ディレクトリが見つかりません".to_string(),
            })?
            .join("md-editor");

        Ok(config_dir.join("config.json"))
    }

    /// 設定を読み込み
    pub fn load() -> AppResult<Self> {
        let config_path = Self::config_path()?;
        
        if !config_path.exists() {
            // 設定ファイルが存在しない場合はデフォルト設定を返す
            return Ok(Self::default());
        }

        let content = std::fs::read_to_string(&config_path)?;
        let config: AppConfig = serde_json::from_str(&content)?;
        Ok(config)
    }

    /// 設定を保存
    pub fn save(&self) -> AppResult<()> {
        let config_path = Self::config_path()?;
        
        // 設定ディレクトリを作成
        if let Some(parent) = config_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(&config_path, content)?;
        Ok(())
    }

    /// 最近使ったファイルを追加
    pub fn add_recent_file(&mut self, path: String) {
        // 既存のエントリを削除
        self.recent_files.retain(|p| p != &path);
        
        // 先頭に追加
        self.recent_files.insert(0, path);
        
        // 最大10件まで
        if self.recent_files.len() > 10 {
            self.recent_files.truncate(10);
        }
    }
}