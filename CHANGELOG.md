# Changelog

## 1.4.2 🌍

### ✨ New Features

- **Language Support** - Added Italian and French translations

## 1.4.1 🚀

### 🐛 Bug Fixes

- **Status Bar Update** - Fixed status bar not updating when CODEOWNERS file is deleted

## 1.4.0 🌍

### ✨ Localization Support

- **Multi-language Support** - Added built-in localization for English and Spanish
- **Improved User Experience** - Status bar, sidebar, hover tooltips, and webview content are now localized
- **Automatic Fallbacks** - Graceful fallback to English when translations are missing

## 1.3.6 🎯

### ✨ Improved Coverage Report

- **Better Section Titles** - "Directories Needing Coverage" and "File Types Needing Coverage" instead of generic "Top Uncovered"
- **Empty State Handling** - Shows celebratory messages when all directories/file types are fully covered
- **Filtered Display** - Only shows directories and file types that actually need coverage in the UI
- **Complete Data Retention** - Export functionality still includes all directories and file types for comprehensive reporting

## 1.3.5 🚀

### ✨ CODEOWNERS File Creation

- Added "Create CODEOWNERS File" command with template and location options
- Added "Open CODEOWNERS Documentation" command linking to GitHub docs
- Improved welcome message with helpful guidance and action buttons
- Better handling of repositories without CODEOWNERS files
- Added automatic refresh when CODEOWNERS file is created, modified, or deleted
- Enhanced error handling with call-to-action buttons for coverage analysis and export commands

## 1.3.4 🔍

### ✨ Enhanced Status Bar

- Status bar now shows "⚠️ No CODEOWNERS" when files aren't covered

## 1.3.3 🎨

### ✨ Visual Improvements

- Coverage analysis progress bars now use color-coded indicators (green/yellow/red based on percentage)

## 1.3.2 🔧

### 🐛 Bug Fixes

- Fixed incorrect URL generation for teams in `@org/team` format
- Correctly identifies `@org/team` as teams instead of individual users

## 1.3.1 🔧

### 🛡️ Quality Assurance

- Added linting to the prepublish process

## 1.3.0 🐙

### ✨ GitHub Team Integration

- Teams in the sidebar and graph view show GitHub buttons for teams (not email addresses)
- Automatically distinguishes between GitHub teams, users, and email addresses
- Click GitHub buttons to open team/user pages in browser

## 1.2.5 🔧

### 🐛 Bug Fixes

- Improved type safety by removing unnecessary type annotations

## 1.2.4 🔧

### 🐛 Bug Fixes

- Fixed extension activation failure by including all necessary runtime dependencies
- Optimized package size (1.34 MB) by excluding development dependencies

## 1.2.3 🔧

### 🐛 Bug Fixes

- Fixed extension activation failure by including missing `temp` dependency

## 1.2.2 🚀

### ⚡ Package Size Optimization

- Reduced package size from 2.0 MB to 1.31 MB
- Reduced node_modules from 3.45 MB to 83.39 KB

## 1.2.1 🔗

### ✨ Interactive Team Links

- Team names in the coverage analysis dashboard are now clickable links that open the ownership graph

## 1.2.0 🚀

### ✨ .gitignore Support

- Coverage analysis now respects `.gitignore` patterns to exclude build artifacts and dependencies

## 1.1.1 🔧

### 🐛 Bug Fixes

- Fixed linting warnings for save dialog filter property names

## 1.1.0 🚀

### ✨ CODEOWNERS Coverage Analysis

- Coverage analysis dashboard showing detailed coverage statistics
- Export coverage reports in JSON/Markdown/Text formats
- Coverage metrics: overall percentage, file counts, directory analysis, file type breakdown, team distribution

## 1.0.0 🎉

## 0.0.23 ⚙️

### ✨ Configuration Options

- Added `codeownersTeams.showStatusBar` setting (default: false)
- Added `codeownersTeams.showHoverInfo` setting (default: false)

### 🔧 Code Improvements

- Centralized path matching logic in `pathMatcher.ts`

## 0.0.22 📊

### ✨ Added

- Status bar shows codeowners for the currently selected file
- Click the status bar item to open the graph for the current file's owners

## 0.0.21 🔄

### 🔧 Changed

- Updated CI/CD testing to use current Node.js LTS versions (20.x, 22.x)

## 0.0.20 🧪

### ✨ Added

- Enhanced test coverage with comprehensive unit tests
- GitHub Actions workflow for automated testing

### 🔧 Changed

- Major parsing improvements using custom shell-like parser
- Enhanced comment handling and path parsing

### 🐛 Fixed

- Parsing quoted paths with spaces
- Parsing escaped spaces in paths
- Parsing comments without spaces

## 0.0.19 🔧

### 🐛 Bug Fixes

- Simplified parsing logic to focus on cross-referencing
- Improved handling of email addresses as owners

## 0.0.18 🔧

### 🐛 Bug Fixes

- Fixed parsing of CODEOWNERS paths with escaped spaces

## 0.0.17 🔧

### 🐛 Bug Fixes

- Fixed CODEOWNERS file detection to support multiple common locations
- Resolved extension activation issues

## 0.0.15 🚀

### ✨ Features

- Added support for CODEOWNERS paths with spaces when properly quoted
- Updated extension name to "CODEOWNERS Visualizer"

### 🐛 Bug Fixes

- Fixed TypeScript compilation configuration

## 0.0.14 🔧

### [0.0.13] 🔧

### ✨ Features

- Quick UX changes

### [0.0.12] 🔧

### ✨ Features

- Added better zoom logic
- Added context menu to copy name/path

### [0.0.11] 🔧

### [0.0.10] 🔧

### 🐛 Bug Fixes

- Persist position and zoom

### [0.0.9] 🔧

### [0.0.8] 🔧

### 🐛 Bug Fixes

- Icons do not work on mac

### [0.0.7] 🚀

### ✨ Features

- Added a quick view of a folder content
- Added ability to pin favourite teams
- Open the tree with the root in view

### 🐛 Bug Fixes

- Wrong path checks

### [0.0.6] 🔧

### ✨ Features

- Added info message
- Improved highlight and search navigation

### 🐛 Bug Fixes

- Added padding to graph
- Search through the teams

### [0.0.5] 🚀

### ✨ Features

- Added panning
- Added search

### 0.0.4 🚀

### ✨ Features

- Added demo.gif
- Added link navigation
- Added sorting and bump version
- Added zoom controls
- Made better description, added graphviz check
- Removed links from downloaded version

### 🐛 Bug Fixes

- Incorrect splitting
- Publisher name

## [0.0.3] 🎉

- Initial release