# Contributing to CODEOWNERS Visualizer

Thank you for your interest in contributing to CODEOWNERS Visualizer! This document provides guidelines for contributing to the project.

## 🧪 Testing

We use Mocha for testing. All new features should include tests:

```bash
# Run all tests
npm test

# Run tests only (if already compiled)
npx mocha test/**/*.test.js

# Run localization tests specifically
npx mocha test/localization*.test.js
```

## 🌍 Localization & Translations

This extension uses VS Code's modern localization system (`@vscode/l10n`). For comprehensive guidance on localization, including how to add new languages and contribute translations, see the [Localization Guide](docs/LOCALIZATION.md).

### Quick Reference

- **Use `localize()` function** for all user-facing strings
- **English text is the key** - no separate key management needed
- **Test with `npm test`** to ensure localization works correctly

## 📝 Code Style

- We use ESLint for code linting
- Run `npm run lint` to check your code
- All code must pass linting before submission

## 🔧 Development Workflow

1. **Create a feature branch** from `main`
2. **Make your changes** with clear, descriptive commit messages
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Run the full test suite** before submitting
6. **Submit a pull request** with a clear description

## 🎯 Areas for Contribution

- **Bug fixes** - Report and fix issues
- **Feature enhancements** - Improve existing functionality
- **Documentation** - Improve README, comments, and guides
- **Testing** - Add more test coverage
- **Performance** - Optimize existing code
- **Localization** - Add new languages or improve translations

## 📋 Pull Request Guidelines

- **Clear title** describing the change
- **Detailed description** of what was changed and why
- **Include tests** for new functionality
- **Update documentation** if needed
- **Ensure all tests pass**

## 🐛 Reporting Issues

When reporting issues, please include:

- **VS Code version**
- **Extension version**
- **Operating system**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** if applicable

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
