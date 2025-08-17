# CODEOWNERS Visualizer

<p align="center">

![CODEOWNERS Visualizer Icon](resources/icon.png)

[![Run Tests](https://github.com/cmtrounce/codeowners-tree/actions/workflows/test.yml/badge.svg)](https://github.com/cmtrounce/codeowners-tree/actions/workflows/test.yml)
[![VSCode Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=cmtrounce.codeowners-visualizer)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Simplify code ownership management with beautiful interactive visualizations**

</p>

---

## ✨ Features

- **🌳 Interactive Tree Visualization** - Generate beautiful tree-like graphs of your codebase ownership
- **👥 Team Management** - Easily see which teams own which parts of your codebase
- **📁 Multi-location Support** - Automatically finds CODEOWNERS files in common locations
- **🎯 Pin Important Teams** - Pin frequently used teams for quick access
- **💾 Export Capabilities** - Save graphs as SVG files for documentation
- **🔍 Smart Parsing** - Handles complex CODEOWNERS syntax including quoted paths and escaped spaces
- **🌍 Multi-language Support** - Built-in localization for English and Spanish with easy extensibility

## 🎬 Demo

![CODEOWNERS Visualizer Demo](resources/demo.gif)

## 🚀 Quick Start

### 1. Install the Extension

Install from the [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=cmtrounce.codeowners-visualizer) or search for "CODEOWNERS Visualizer" in VS Code.

### 2. Install Graphviz

The extension requires Graphviz for rendering the interactive graphs.

<details>
<summary><strong>Windows</strong></summary>

1. Visit the [Graphviz download page](https://graphviz.gitlab.io/download/) for Windows
2. Download the MSI installer for your Windows version (64-bit or 32-bit)
3. Run the installer and follow the on-screen instructions
4. Add the Graphviz `bin` directory to your system's PATH environment variable

</details>

<details>
<summary><strong>macOS</strong></summary>

```bash
brew install graphviz
```

Homebrew will automatically add Graphviz to your system's PATH.

</details>

<details>
<summary><strong>Linux (Ubuntu/Debian)</strong></summary>

```bash
sudo apt-get install graphviz
```

</details>

### 3. Start Visualizing

1. Open a workspace with a `CODEOWNERS` file
2. Look for the "Codeowners Teams" panel in the Explorer
3. Click on any team to generate an interactive ownership graph

## 📋 Supported CODEOWNERS Features

✅ **Basic path patterns** - `src/main.js @team1 @team2`  
✅ **Quoted paths with spaces** - `"src/my folder/file.txt" @team1`  
✅ **Escaped spaces** - `src/file\ with\ spaces.js @team1`  
✅ **Comments** - `src/main.js @team1 # This is a comment`  
✅ **Email addresses** - `docs/* docs@example.com`  
✅ **Special characters** - `src/main#.js @team1`, `src/@main.js @team1`  
✅ **Multiple locations** - Automatically finds `CODEOWNERS`, `.github/CODEOWNERS`, `docs/CODEOWNERS`  
✅ **Glob patterns** - Full support for `*.js`, `**/logs`, `{js,ts}`, `[abc]`, etc.

## ⚙️ Configuration

The extension provides several configuration options to customize your experience:

### Status Bar Integration
- **`codeownersTeams.showStatusBar`** (default: `false`) - Shows current file's codeowner in status bar

### Hover Information
- **`codeownersTeams.showHoverInfo`** (default: `false`) - Shows codeowner info on file hover

### Pinned Teams
- **`codeownersTeams.pinnedTeams`** (default: `[]`) - Array of team names to pin at top

### How to Configure

1. Open VS Code Settings (`Cmd/Ctrl + ,`)
2. Search for "CODEOWNERS Visualizer"
3. Toggle features on/off

## 🛠️ Development

### Prerequisites

- Node.js (version 20 or higher)
- npm
- Git

### Setup

```bash
git clone https://github.com/cmtrounce/codeowners-tree.git
cd codeowners-tree
npm install
npm run compile
```

### Testing

```bash
npm test
npx mocha test/**/*.test.js
npm run lint
```

### Localization

Uses VS Code's built-in localization system (`@vscode/l10n`). See [Localization Guide](docs/LOCALIZATION.md) for details.

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

This extension is based on the original [CODEOWNERS Tree](https://github.com/a-ignatev/codeowners-tree) by Andrei Ignatev, with additional improvements and features.

## 🫶 Support this project

[Buy me a coffee](https://buymeacoffee.com/cmtrounce)

---

<p align="center">

**Made with ❤️ for the VSCode community**

</p>
