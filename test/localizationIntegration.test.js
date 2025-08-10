// Set up mock before any imports
const Module = require('module');
const originalRequire = Module.prototype.require;

const mockVscode = {
  l10n: {
    t: (message, ...args) => {
      // Mock implementation that returns localized strings based on key
      const mockTranslations = {
        'CODEOWNERS Visualizer': 'CODEOWNERS Visualizer',
        'CODEOWNERS file created at {0}': 'CODEOWNERS file created at {0}',
        'CODEOWNERS: {0}': 'CODEOWNERS: {0}',
        'Open CODEOWNERS Graph': 'Open Codeowners Graph'
        // Removed 'Failed to create CODEOWNERS file: {0}' to trigger fallback
      };

      // Check if key exists in mock translations
      if (mockTranslations[message]) {
        let result = mockTranslations[message];
        // Replace placeholders with arguments
        args.forEach((arg, index) => {
          result = result.replace(`{${index}}`, String(arg));
        });
        return result;
      }

      // For messages not in mock translations, throw an error to trigger fallback
      // This simulates what happens when vscode.l10n.t fails
      throw new Error('Message not found in translations');
    }
  },
  env: {
    language: 'en'
  }
};

// Mock the vscode module
Module.prototype.require = function(id) {
  if (id === 'vscode') {
    return mockVscode;
  }
  return originalRequire.apply(this, arguments);
};

// Clear the require cache to ensure fresh module loading
delete require.cache[require.resolve('../out/localization')];

// Now import the modules
const assert = require('assert');
const path = require('path');
const localizationModule = require('../out/localization');

describe('localization integration', () => {
  after(() => {
    // Restore original require
    Module.prototype.require = originalRequire;
  });

  it('should handle basic localization function', () => {
    assert.strictEqual(localizationModule.localize('CODEOWNERS Visualizer'), 'CODEOWNERS Visualizer');
  });

  it('should handle string substitution with arguments', () => {
    const result = localizationModule.localize('CODEOWNERS file created at {0}', 'test/path');
    assert.strictEqual(result, 'CODEOWNERS file created at test/path');
  });

  it('should handle multiple argument substitution', () => {
    const result = localizationModule.localize('CODEOWNERS: {0}', 'team1, team2');
    assert.strictEqual(result, 'CODEOWNERS: team1, team2');
  });

  it('should handle missing arguments', () => {
    const result = localizationModule.localize('CODEOWNERS: {0}');
    assert.strictEqual(result, 'CODEOWNERS: {0}');
  });

  it('should handle mixed argument types', () => {
    const result = localizationModule.localize('Failed to create CODEOWNERS file: {0}', 'test error');
    assert.strictEqual(result, 'Failed to create CODEOWNERS file: test error');
  });
});
