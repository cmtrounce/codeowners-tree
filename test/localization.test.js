// Set up mock before any imports
const Module = require('module');
const originalRequire = Module.prototype.require;

const mockVscode = {
  l10n: {
    t: (message, ...args) => {
      // Mock implementation that returns localized strings based on message
      const mockTranslations = {
        'CODEOWNERS Visualizer': 'CODEOWNERS Visualizer',
        'CODEOWNERS file created at {0}': 'CODEOWNERS file created at {0}',
        'CODEOWNERS: {0}': 'CODEOWNERS: {0}',
        'Open CODEOWNERS Graph': 'Open Codeowners Graph'
      };

      // Check if message exists in mock translations
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

// Now import the modules
const assert = require('assert');
const { localize } = require('../out/localization');

describe('localize', () => {
  after(() => {
    // Restore original require
    Module.prototype.require = originalRequire;
  });

  it('should handle string substitution with arguments', () => {
    const result = localize('CODEOWNERS file created at {0}', 'test/path');
    assert.strictEqual(result, 'CODEOWNERS file created at test/path');
  });

  it('should handle multiple arguments substitution', () => {
    const result = localize('CODEOWNERS: {0}', 'team1, team2');
    assert.strictEqual(result, 'CODEOWNERS: team1, team2');
  });

  it('should handle empty arguments', () => {
    const result = localize('CODEOWNERS Visualizer');
    assert.strictEqual(result, 'CODEOWNERS Visualizer');
  });

  it('should handle empty string as key', () => {
    const result = localize('');
    assert.strictEqual(result, '');
  });

  it('should handle null and undefined arguments gracefully', () => {
    const result = localize('CODEOWNERS Visualizer', null, undefined);
    assert.strictEqual(result, 'CODEOWNERS Visualizer');
  });

  it('should handle complex string substitution scenarios', () => {
    const result = localize('CODEOWNERS: {0}', 'team1, team2, team3');
    assert.strictEqual(result, 'CODEOWNERS: team1, team2, team3');
  });

  it('should handle fallback for unknown messages', () => {
    const result = localize('Unknown message: {0}', 'test arg');
    assert.strictEqual(result, 'Unknown message: test arg');
  });
});
