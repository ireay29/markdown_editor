# Markdown Editor with Block Management

A powerful Markdown editor built with Tauri, React, and TypeScript featuring block-level drag & drop functionality and advanced editing features.

## Features

- 📝 Rich Markdown editing with CodeMirror 6
- 🔄 Real-time preview with syntax highlighting
- 🎯 Block-level drag & drop reordering
- 🔍 Document outline navigation
- 📊 Variable system for dynamic content
- ⚡ Syntax checking and error detection
- 🎨 Modern UI with Tailwind CSS

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
