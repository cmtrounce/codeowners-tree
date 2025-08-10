# Localization Guide

This document provides comprehensive guidance on how localization works in the CODEOWNERS Visualizer extension and how to add or modify translations.

## 🌍 Overview

The CODEOWNERS Visualizer extension uses VS Code's modern localization system (`@vscode/l10n`) which provides a streamlined approach to internationalization. This system automatically bundles localization files and provides built-in fallback mechanisms.

## 🏗️ Architecture

### How Localization Works

1. **Source strings**: English text is used directly as localization keys
2. **Translation files**: Located in `l10n/` directory
3. **Package strings**: `package.nls.json` files for `package.json` localization
4. **Automatic bundling**: Localization is handled automatically by VS Code - no preprocessing required

### File Structure

```
codeowners-tree/
├── l10n/
│   ├── bundle.l10n.json          # English (base language)
│   └── bundle.l10n.es.json      # Spanish translations
├── package.nls.json              # English strings for package.json
├── package.nls.es.json          # Spanish strings for package.json
└── src/
    └── localization.ts           # Core localization function
```

## 🚀 Adding New User-Facing Strings

### 1. Use the `localize()` Function

When adding new user-facing strings, always use the `localize()` function instead of hardcoded text:

```typescript
// ✅ Good
vscode.window.showInformationMessage(localize("No CODEOWNERS file found"));

// ❌ Bad
vscode.window.showInformationMessage("No CODEOWNERS file found");
```

### 2. The English Text IS the Key

No need to create separate keys - just use the English text directly:

```typescript
// ✅ Good - English text is the key
localize("Failed to create CODEOWNERS file: {0}", errorMessage);

// ❌ Bad - Don't create separate keys
localize("error.createFailed", errorMessage);
```

### 3. String Interpolation

Use `{0}`, `{1}`, etc. for dynamic values:

```typescript
// Single argument
localize("File {0} is owned by team {1}", fileName, teamName);

// Multiple arguments
localize("Team {0} owns {1} files in {2} directories", teamName, fileCount, dirCount);
```

### 4. Import the Function

Make sure to import the `localize` function in your file:

```typescript
import { localize } from './localization';
```

## 📝 Translation Files

### Bundle Files (`l10n/` directory)

These files contain translations for strings used in the extension code:

#### `l10n/bundle.l10n.json` (English - Base)
```json
{
  "CODEOWNERS Visualizer": "CODEOWNERS Visualizer",
  "No CODEOWNERS file found": "No CODEOWNERS file found",
  "Failed to create CODEOWNERS file: {0}": "Failed to create CODEOWNERS file: {0}"
}
```

#### `l10n/bundle.l10n.es.json` (Spanish)
```json
{
  "CODEOWNERS Visualizer": "Visualizador de CODEOWNERS",
  "No CODEOWNERS file found": "No se encontró archivo CODEOWNERS",
  "Failed to create CODEOWNERS file: {0}": "Error al crear archivo CODEOWNERS: {0}"
}
```

### Package Files (Root directory)

These files contain translations for strings used in `package.json`:

#### `package.nls.json` (English)
```json
{
  "extension.displayName": "CODEOWNERS Visualizer",
  "extension.description": "Generate interactive tree-like graphs of your codebase ownership",
  "command.openGraph.title": "Open CODEOWNERS Graph"
}
```

#### `package.nls.es.json` (Spanish)
```json
{
  "extension.displayName": "Visualizador de CODEOWNERS",
  "extension.description": "Genera gráficos interactivos tipo árbol de la propiedad del código",
  "command.openGraph.title": "Abrir Gráfico CODEOWNERS"
}
```

## 🌐 Adding New Languages

To add support for a new language (e.g., French):

### 1. Create Bundle File

Create `l10n/bundle.l10n.fr.json`:

```json
{
  "CODEOWNERS Visualizer": "Visualiseur CODEOWNERS",
  "No CODEOWNERS file found": "Aucun fichier CODEOWNERS trouvé",
  "Failed to create CODEOWNERS file: {0}": "Échec de la création du fichier CODEOWNERS: {0}"
}
```

### 2. Create Package File

Create `package.nls.fr.json`:

```json
{
  "extension.displayName": "Visualiseur CODEOWNERS",
  "extension.description": "Générer des graphiques interactifs en forme d'arbre de la propriété de votre base de code",
  "command.openGraph.title": "Ouvrir le Graphique CODEOWNERS"
}
```

### 3. Update `package.json`

Add the locale to the `l10n` field:

```json
{
  "l10n": "./l10n",
  "languages": ["en", "es", "fr"]
}
```

### 4. Add Tests

Include the new language in localization tests to ensure consistency.

## 🧪 Testing Localization

### Running Tests

```bash
# Test localization functionality
npm test

# Run localization tests specifically
npx mocha test/localization*.test.js
```

### What Tests Verify

- ✅ Fallback mechanism works correctly
- ✅ String interpolation handles arguments properly
- ✅ Mock behavior simulates real `vscode.l10n.t()` calls
- ✅ Error handling and fallback logic

### Test Structure

The localization tests use mocked `vscode.l10n.t()` calls to simulate the real environment and verify that:

1. **Known messages** return translated versions
2. **Unknown messages** trigger fallback logic
3. **String interpolation** works correctly in fallback mode
4. **Error handling** gracefully manages missing translations

## 🔧 Development Workflow

### 1. Add New String

```typescript
// In your source file
vscode.window.showInformationMessage(localize("New feature is ready!"));
```

### 2. Add to English Bundle

```json
// In l10n/bundle.l10n.json
{
  "New feature is ready!": "New feature is ready!"
}
```

### 3. Add to Other Languages

```json
// In l10n/bundle.l10n.es.json
{
  "New feature is ready!": "¡La nueva función está lista!"
}
```

### 4. Test

```bash
npm test
```

## 🚨 Common Pitfalls

### 1. Missing Translation Keys

**Problem**: String appears in English even when language is set to Spanish
**Solution**: Ensure the English text exists in both `bundle.l10n.json` and `bundle.l10n.es.json`

### 2. Incorrect String Interpolation

**Problem**: Placeholders like `{0}` appear in the final output
**Solution**: Ensure arguments are passed in the correct order and the fallback logic handles them properly

### 3. Package.json Strings Not Localized

**Problem**: `%` placeholders still showing in the UI
**Solution**: Ensure `package.nls.*.json` files are in the root directory and contain all required keys

### 4. Build Issues

**Problem**: Localization not working after build
**Solution**: Ensure `@vscode/l10n` is in dependencies and the `l10n` field in `package.json` points to the correct directory

## 📚 Best Practices

### 1. **Consistency**: Use consistent terminology across all languages
### 2. **Context**: Provide context for translators when strings might be ambiguous
### 3. **Testing**: Always test localization with different language settings
### 4. **Fallbacks**: Ensure fallback text is user-friendly and informative
### 5. **Documentation**: Keep this guide updated as the localization system evolves

## 🔗 Related Resources

- [VS Code Localization Documentation](https://code.visualstudio.com/api/working-with-extensions/bundling-extension#localization-support)
- [@vscode/l10n Package](https://www.npmjs.com/package/@vscode/l10n)
- [Extension Localization Guide](https://code.visualstudio.com/api/working-with-extensions/bundling-extension#localization-support)

## 🤝 Contributing to Localization

When contributing to localization:

1. **Follow the established patterns** in existing translation files
2. **Maintain consistency** with existing translations
3. **Test thoroughly** with the localization test suite
4. **Update this guide** if you discover new patterns or best practices
5. **Consider cultural context** when translating user-facing messages

---

*This guide is maintained by the CODEOWNERS Visualizer development team. For questions or suggestions, please open an issue or submit a pull request.*
