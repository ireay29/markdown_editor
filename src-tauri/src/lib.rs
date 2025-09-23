mod commands;
mod core;
mod utils;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::file_operations::read_file,
            commands::file_operations::save_file,
            commands::file_operations::select_file,
            commands::file_operations::select_save_path,
            commands::file_operations::get_app_config,
            commands::file_operations::save_app_config,
            commands::markdown_parser::parse_markdown,
            commands::markdown_parser::highlight_code_block,
            commands::markdown_parser::get_supported_languages,
            commands::markdown_parser::get_available_themes,
            commands::markdown_parser::highlight_markdown_content,
            commands::markdown_parser::reorder_blocks,
            commands::markdown_parser::delete_block,
            commands::markdown_parser::duplicate_block,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
