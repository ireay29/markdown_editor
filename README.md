# Markdown Editor with Block Management

A powerful Markdown editor built with Tauri, React, and TypeScript featuring block-level drag & drop functionality and advanced editing features.

## Features

- 📝 **Rich Markdown Editing**: Powered by CodeMirror 6 for a robust and extensible editing experience, including multi-language syntax highlighting.
- 🔄 **Real-time Preview**: Instantly see your Markdown rendered as you type.
- 🎯 **Block Management**: Drag & drop functionality to easily reorder Markdown blocks, enhancing content organization.
- 🔍 **Document Outline Navigation**: Quickly navigate through your document using an automatically generated outline.
- 📊 **Variable System**: Define and use variables in the format `{{variable}}` for dynamic content generation, ideal for LLM prompts and templates.
- ⚡ **Syntax Checking**: Real-time validation against GitHub Flavored Markdown (GFM) specifications, with immediate error feedback.
- 🎨 **Modern UI**: A clean and responsive user interface built with Tailwind CSS.

## Technology Stack

-   **Tauri**: For building cross-platform desktop applications using web technologies.
-   **React**: A JavaScript library for building user interfaces.
-   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
-   **CodeMirror 6**: A versatile text editor implemented in JavaScript for the browser.
-   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
-   **Rust**: A language empowering everyone to build reliable and efficient software (used for Tauri's backend).

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Install Tauri dependencies
npm run tauri deps
```

### Development
```bash
# Start development server (Frontend + Backend)
npm run dev

# Start only frontend (React/Vite)
vite

# Build for development
npm run build

# Preview production build
npm run preview
```

### Testing
```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage
```

### Tauri Commands
```bash
# Build Tauri app
npm run tauri build

# Start Tauri in dev mode
npm run tauri dev

# Generate Tauri icons
npm run tauri icon

# Check Tauri info
npm run tauri info
```

## Quick Start

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:1420/`

3. Start editing Markdown files and test the drag & drop block functionality!

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
