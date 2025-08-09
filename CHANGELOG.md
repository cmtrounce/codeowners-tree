# Changelog

## 1.3.2 🔧

### 🐛 Bug Fixes

- **GitHub Team URL Fix** - Fixed incorrect URL generation for teams in `@org/team` format
- **Team Detection** - Correctly identifies `@org/team` as teams instead of individual users
- **Proper GitHub URLs** - Now generates correct `https://github.com/orgs/org/teams/team` URLs

## 1.3.1 🔧

### 🛡️ Quality Assurance

- **Automated Linting** - Added linting to the prepublish process to ensure code quality before packaging
- **Quality Gate** - Extension will now fail to package if ESLint finds any issues

## 1.3.0 🐙

### ✨ GitHub Team Integration

**New feature**: Added GitHub team integration to quickly view team members and details directly from the extension.

- **GitHub Team Buttons** - Teams in the sidebar and graph view show GitHub buttons for teams (not email addresses)
- **Smart Detection** - Automatically distinguishes between GitHub teams, users, and email addresses
- **Quick Access** - Click GitHub buttons to open team/user pages in browser
- **Organization Detection** - Automatically determines GitHub organization from repository

## 1.2.5 🔧

### Bug Fixes
- Improved type safety by removing unnecessary type annotations and letting TypeScript infer types

---

## 1.2.4 🔧

### Bug Fixes
- Fixed extension activation failure by including all necessary runtime dependencies
- Optimized package size (1.34 MB) by excluding development dependencies while keeping runtime dependencies
- Maintains full type safety and proper graphviz integration

---

## 1.2.3 🔧

### Bug Fixes
- Fixed extension activation failure by including missing `temp` dependency required by the `graphviz` package

---

## 1.2.2 🚀

### ⚡ Package Size Optimization

**Performance improvement**: Significantly reduced extension package size for faster downloads and installations.

#### 🎯 What's Improved
- **34.5% Smaller Package** - Reduced from 2.0 MB to 1.31 MB
- **97.6% Smaller Dependencies** - Reduced node_modules from 3.45 MB to 83.39 KB
- **Faster Downloads** - Users get the extension much faster
- **Faster Installations** - Less data to extract during installation

#### 🔧 Technical Changes
- **Optimized .vscodeignore** - Excluded development dependencies from the package
- **Runtime Dependencies Only** - Only includes what's actually needed to run the extension
- **Excluded Dev Tools** - Removed TypeScript, ESLint, Mocha, and other dev dependencies
- **Maintained Functionality** - All features work exactly the same

#### 🎯 Benefits for Users
- **Faster Extension Installation** - Reduced download and extraction time
- **Lower Bandwidth Usage** - Less data transfer required
- **Better User Experience** - Quicker access to the extension features
- **Same Functionality** - No changes to how the extension works

---

## 1.2.1 🔗

### ✨ Interactive Team Links

**New feature**: Team names in the coverage analysis dashboard are now clickable links that open the ownership graph for that team.

#### 🎯 What's New
- **Clickable Team Names** - Click any team name in the "Team Coverage Distribution" section
- **Quick Navigation** - Instantly open the ownership graph for the selected team
- **Seamless Integration** - Uses existing `codeownersTeams.openGraph` command
- **Visual Feedback** - Links styled with VS Code theme colors and hover effects

#### 🎯 User Experience
- **Faster Workflow** - No need to manually search for teams in the sidebar
- **Contextual Navigation** - Jump directly from coverage analysis to team ownership details
- **Consistent Interface** - Links follow VS Code's native styling and behavior

---

## 1.2.0 🚀

### ✨ .gitignore Support

**New feature**: Coverage analysis now respects `.gitignore` patterns to exclude build artifacts, dependencies, and other files that shouldn't be covered by CODEOWNERS.

#### 🎯 What's New
- **Automatic .gitignore Detection** - Automatically reads `.gitignore` file in workspace root
- **Pattern Matching** - Supports wildcard patterns (`*.log`, `*.tmp`), directory patterns (`dist/`, `build/`), and absolute patterns (`/specific-file`)
- **Smart Exclusion** - Excludes files and directories that match gitignore patterns from coverage analysis
- **Backward Compatible** - Works normally if no `.gitignore` file is present

#### 📊 Improved Coverage Accuracy
- **More Meaningful Metrics** - Coverage percentages now reflect only files that should be tracked
- **Build Artifact Exclusion** - Automatically excludes `dist/`, `build/`, `node_modules/`, etc.
- **IDE File Exclusion** - Excludes `.vscode/`, `.idea/`, and other IDE-specific files
- **OS File Exclusion** - Excludes `.DS_Store`, `Thumbs.db`, and other OS-generated files

#### 🎯 Use Cases
- **Accurate Coverage Reporting** - Get realistic coverage percentages without build artifacts skewing results
- **Focus on Source Code** - Analysis focuses on files that actually need CODEOWNERS coverage
- **Team Planning** - Better insights into actual code ownership gaps

---

## 1.1.1 🔧

### Bug Fixes
- Fixed linting warnings for save dialog filter property names (JSON → json, Markdown → markdown, Text → text)

---

## 1.1.0 🚀

### ✨ CODEOWNERS Coverage Analysis

**Major new feature**: Comprehensive coverage analysis to help teams improve their CODEOWNERS coverage and identify gaps in ownership documentation.

#### 🎯 New Features
- **Coverage Analysis Dashboard** - Beautiful webview panel showing detailed coverage statistics
- **Coverage Analysis Command** - `codeownersTeams.analyzeCoverage` to scan entire workspace
- **Export Coverage Reports** - `codeownersTeams.exportCoverage` to generate reports in JSON/Markdown/Text formats
- **Progress Tracking** - Real-time progress notifications during analysis

#### 📊 Coverage Metrics
- **Overall Coverage Percentage** - Visual circular progress indicator with color coding
- **File Counts** - Total, covered, and uncovered files with color-coded text
- **Directory Analysis** - Top 10 directories with most uncovered files and progress bars
- **File Type Breakdown** - Coverage by file extension (.js, .md, .test.js, etc.) with progress bars
- **Team Distribution** - How many files each team owns
- **Export Reports** - Color-coded emoji indicators (🟢 80%+, 🟡 60%+, 🔴 <60%) in Markdown exports

#### 📋 Usage
1. **Run Analysis**: `Ctrl/Cmd + Shift + P` → "CODEOWNERS: Analyze Coverage"
2. **View Dashboard**: Beautiful webview with charts and progress bars
3. **Export Reports**: `Ctrl/Cmd + Shift + P` → "CODEOWNERS: Export Coverage"
4. **Choose Format**: JSON (raw data), Markdown (documentation), or Text

#### 🎯 Use Cases
- **Identify Coverage Gaps** - See exactly what files lack ownership documentation
- **Track Improvement** - Monitor coverage changes over time
- **Team Planning** - Understand workload distribution across teams
- **Documentation** - Generate reports for team meetings and planning
- **Compliance** - Ensure proper ownership documentation for audit purposes

---

## 1.0.0 🎉

## 0.0.23

### Configuration Options
- Added `codeownersTeams.showStatusBar` setting (default: false) to enable/disable status bar integration
- Added `codeownersTeams.showHoverInfo` setting (default: false) to enable/disable hover information
- Both features are now opt-in to reduce UI clutter by default
- Configuration changes prompt users to reload the window for immediate effect

### Code Improvements
- Centralized path matching logic in `pathMatcher.ts` to eliminate code duplication
- Created `findOwnersForFile` helper for consistent owner lookup across components
- Improved error handling and fallback logic for file owner detection

### User Experience
- Status bar and hover features are now disabled by default for a cleaner initial experience
- Users can enable features individually based on their preferences
- Clear documentation of configuration options in README

## 0.0.22

### Added
* **Status Bar Integration** - Shows codeowners for the currently selected file in the bottom status bar
* **Quick Graph Navigation** - Click the status bar item to open the graph for the current file's owners
* **Real-time Updates** - Status bar updates automatically when switching between files
* **Smart Path Matching** - Supports exact paths, directory patterns, and basic glob patterns

### Changed
* **Enhanced User Experience** - Immediate visibility of file ownership without opening the sidebar
* **Improved Navigation** - Direct access to ownership graphs from the status bar

### Technical Improvements
* **New CodeownerStatusBar Component** - Handles status bar display and file ownership detection
* **Path Matching Logic** - Intelligent matching of files to CODEOWNERS patterns
* **Event-driven Updates** - Responds to file changes and workspace changes

## [0.0.21]

### Changed
* **Updated CI/CD testing** to use current Node.js LTS versions (20.x, 22.x) instead of end-of-life 18.x
* **Improved GitHub Actions workflow** for better compatibility with modern Node.js environments

### Technical Improvements
* **Modernized test environment** to align with current Node.js LTS support
* **Removed testing against deprecated Node.js versions** for cleaner CI/CD pipeline

## [0.0.20]

### Added
* **Enhanced test coverage** with comprehensive unit tests for all parsing functions
* **GitHub Actions workflow** for automated testing on push to main branch
* **Development documentation** in README with setup and testing instructions

### Changed
* **Major parsing improvements** using custom shell-like parser for robust path parsing
* **Enhanced comment handling** to properly strip inline comments from owners
* **Improved path parsing** to handle quoted paths, escaped spaces, and special characters
* **Better Node.js compatibility** by removing ES module dependencies

### Fixed
* **Parsing quoted paths** with spaces (e.g., `"src/my folder/file.txt"`)
* **Parsing escaped spaces** in paths (e.g., `src/file\ with\ spaces.js`)
* **Parsing comments** without spaces (e.g., `@team2#comment`)
* **Parsing special characters** in paths (e.g., `src/main#.js`, `src/@main.js`)
* **Parsing email addresses** as owners (e.g., `docs@example.com`)
* **Test setup issues** by converting from Jest to Mocha and fixing module loading
* **Node.js 18.x compatibility** by removing ES module dependencies

### Technical Improvements
* **Replace complex dependencies** with lightweight custom parser
* **Dependency cleanup** by removing unused packages
* **Source map generation** for better debugging experience
* **Simplified test runner** using Mocha directly

### [0.0.19](https://github.com/cmtrounce/codeowners-visualizer/compare/v0.0.18...v0.0.19)

### Bug Fixes

* Simplify parsing logic to focus on cross-referencing rather than validation
* Remove unnecessary @ symbol validation for owners
* Improve handling of email addresses as owners (e.g., `docs@example.com`)
* Maintain backward compatibility while simplifying code

### [0.0.18](https://github.com/cmtrounce/codeowners-visualizer/compare/v0.0.17...v0.0.18)

### Bug Fixes

* Fix parsing of CODEOWNERS paths with escaped spaces (e.g., `src/my\ directory/file.js`)
* Improve path parsing logic to correctly handle unescaped whitespace as path/owner separator

### [0.0.17](https://github.com/cmtrounce/codeowners-visualizer/compare/v0.0.16...v0.0.17)

### Bug Fixes

* Fix CODEOWNERS file detection to support multiple common locations (root, .github/, docs/)
* Resolve extension activation issues with proper dependency bundling
* Fix "command not found" errors by ensuring node_modules are included in package

### [0.0.15](https://github.com/cmtrounce/codeowners-visualizer/compare/v0.0.14...v0.0.15)

### Features

* Add support for CODEOWNERS paths with spaces when properly quoted
* Improve extension packaging and build configuration
* Update extension name to "CODEOWNERS Visualizer" for better clarity
* Add comprehensive unit tests for core functionality

### Bug Fixes

* Fix TypeScript compilation configuration for proper build process
* Resolve packaging conflicts between .vscodeignore and files property
* Clean up extension package to exclude unnecessary source files

### [0.0.14](https://github.com/a-ignatev/codeowners-tree/compare/v0.0.13...v0.0.14)

### [0.0.13](https://github.com/a-ignatev/codeowners-tree/compare/v0.0.12...v0.0.13) (2023-11-26)


### Features

* quick ux changes ([b7caac9](https://github.com/a-ignatev/codeowners-tree/commit/b7caac9008b533c5793e7fd920a6241854f915d8))

### [0.0.12](https://github.com/a-ignatev/codeowners-tree/compare/v0.0.11...v0.0.12) (2023-11-10)


### Features

* add better zoom logic ([08854bc](https://github.com/a-ignatev/codeowners-tree/commit/08854bc6a55f1513f05ff4b0f2bb086fb8b564ef))
* add context menu to copy name/path ([99e7bb9](https://github.com/a-ignatev/codeowners-tree/commit/99e7bb9a6b3d0a31506fe0f24bd60f850bec1dcd))

### [0.0.11](https://github.com/a-ignatev/codeowners-tree/compare/v0.0.10...v0.0.11) (2023-11-08)

### [0.0.10](https://github.com/a-ignatev/codeowners-tree/compare/v0.0.9...v0.0.10) (2023-11-02)


### Bug Fixes

* persist position and zoom ([fda57eb](https://github.com/a-ignatev/codeowners-tree/commit/fda57eb683c0092a84851d01865399a70bc88993))

### [0.0.9](https://github.com/a-ignatev/codeowners-tree/compare/v0.0.8...v0.0.9) (2023-10-27)

### [0.0.8](https://github.com/a-ignatev/codeowners-tree/compare/v0.0.7...v0.0.8) (2023-10-27)


### Bug Fixes

* icons do not work on mac ([0d9a92e](https://github.com/a-ignatev/codeowners-tree/commit/0d9a92ed31fd9e44b741344724cff2433faadb0e))

### [0.0.7](https://github.com/a-ignatev/codeowners-tree/compare/v0.0.6...v0.0.7) (2023-10-26)


### Features

* add a quick view of a folder content ([0971ba3](https://github.com/a-ignatev/codeowners-tree/commit/0971ba36a9c1cac235bfe11e8cddf945c514f2f4))
* add ability to pin favourite teams ([24edb71](https://github.com/a-ignatev/codeowners-tree/commit/24edb71bd776da2696c4cb527f3db80ef481e4eb))
* open the tree with the root in view ([5950c36](https://github.com/a-ignatev/codeowners-tree/commit/5950c36c244390d762c6bce731999d9d0fdcaaff))


### Bug Fixes

* wrong path checks ([bce845a](https://github.com/a-ignatev/codeowners-tree/commit/bce845a841aecf54487359a9d4675bfda9ecaf0f))

### [0.0.6](https://github.com/a-ignatev/codeowners-tree/compare/v0.0.5...v0.0.6) (2023-10-06)


### Features

* add info message ([a5d4b1c](https://github.com/a-ignatev/codeowners-tree/commit/a5d4b1c9e83241638f95a3ddb3bbdeeeecad3ed5))
* improve highlight and search navigation ([d232186](https://github.com/a-ignatev/codeowners-tree/commit/d23218665a40892402ef00e3b78867ba662c3a4b))


### Bug Fixes

* add padding to graph ([03e79fb](https://github.com/a-ignatev/codeowners-tree/commit/03e79fb9154443df9f6ec3bdf0feb06447f6fcbd))
* search through the teams ([ee2491b](https://github.com/a-ignatev/codeowners-tree/commit/ee2491bc079a32dc1b9120fbf81d4251c2bb2dfc))

### [0.0.5](https://github.com/a-ignatev/codeowners-tree/compare/v0.0.4...v0.0.5) (2023-10-01)


### Features

* add paning ([d8d7c73](https://github.com/a-ignatev/codeowners-tree/commit/d8d7c73041f7fcc1a069daf261ffb549a9d519a2))
* add search ([74e530d](https://github.com/a-ignatev/codeowners-tree/commit/74e530dc17e665f3d0225239d62f485633fc39ee))

### 0.0.4 (2023-10-01)


### Features

* add demo.gif ([8fff01a](https://github.com/a-ignatev/codeowners-tree/commit/8fff01af8114e974143c3e318c3c72534098dcb2))
* add link navigation ([f967a8c](https://github.com/a-ignatev/codeowners-tree/commit/f967a8caea231d6aaae1682a9dd829b662e1ca5b))
* add sorting and bump version ([9bb99a5](https://github.com/a-ignatev/codeowners-tree/commit/9bb99a5785ea3edd3b3c51bb3c892b0288d721c1))
* add zoom controls ([32ce64f](https://github.com/a-ignatev/codeowners-tree/commit/32ce64fd10fdb87b44ee8d654abda27e13615586))
* make better description, add graphviz check ([7f2a2ab](https://github.com/a-ignatev/codeowners-tree/commit/7f2a2abb37be0764ba6679406bc32a0ad8dcf5ae))
* remove links from downloaded version ([fe0216d](https://github.com/a-ignatev/codeowners-tree/commit/fe0216d7ec4c5d6e0510b1ff5b96eac4bd9bf7ad))


### Bug Fixes

* incorrect splitting ([2f204b7](https://github.com/a-ignatev/codeowners-tree/commit/2f204b7bf86f1a266d3b05527d356b27b390423e))
* publisher name ([38d8a4e](https://github.com/a-ignatev/codeowners-tree/commit/38d8a4e91d4e65c1d8f35e59c07f64def6724d37))

## [0.0.3]

- Initial release