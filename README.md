# CODEOWNERS Visualizer

CODEOWNERS Visualizer is a Visual Studio Code extension designed to simplify the management and visualization of ownership within your codebase. Managing code ownership across various files and directories can be a daunting task, especially in larger teams. With CODEOWNERS Visualizer, you can easily create and visualize ownership hierarchies in a beautiful tree-like graph, making it effortless to understand who is responsible for what in your codebase.

![Current File](/resources/demo.gif "CODEOWNERS Visualizer")

## Limitations

- Codeowners glob-like file path pattern is not yet supported

## Installation

Before using CODEOWNERS Visualizer, you'll need to install the Graphviz application, which is used for rendering the interactive tree-like graph. Follow the steps below to install Graphviz:

### Installing Graphviz on Windows

1. Visit the [Graphviz download page](https://graphviz.gitlab.io/download/) for Windows.

2. Download the MSI installer for your Windows version (64-bit or 32-bit).

3. Run the installer and follow the on-screen instructions.

4. After installation, make sure to add the Graphviz `bin` directory to your system's PATH environment variable. This allows CODEOWNERS Visualizer to locate the Graphviz executables.

### Installing Graphviz on macOS

Install Graphviz using Homebrew by running the following command in your terminal:

`brew install graphviz`

Homebrew will automatically add Graphviz to your system's PATH.

### Installing Graphviz on Linux (Ubuntu/Debian)
Open a terminal and run the following command to install Graphviz using the package manager:

`sudo apt-get install graphviz`

## Getting Started
Once you have Graphviz installed, you can start using CODEOWNERS Visualizer to generate and visualize ownership hierarchies for your codebase.

The new panel is located in the Explorer.

## Development

### Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)
- Git

### Setting Up the Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cmtrounce/codeowners-visualizer.git
   cd codeowners-visualizer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Compile the TypeScript code:**
   ```bash
   npm run compile
   ```

### Running Tests

To run the test suite:

```bash
npm test
```

This will compile the code, run linting, and execute all tests.

To run tests only (if already compiled):
```bash
npx mocha test/**/*.test.js
```

## Credits

This extension is based on the original [CODEOWNERS Tree](https://github.com/a-ignatev/codeowners-tree) by Andrei Ignatev, with additional improvements and features.
