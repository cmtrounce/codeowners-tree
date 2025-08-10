const assert = require('assert');
const { findCodeownersFile } = require('../out/helpers/findCodeownersFile');
const fs = require('fs');
const path = require('path');

describe('findCodeownersFile', () => {
  const originalExistsSync = fs.existsSync;

  beforeEach(() => {
    // Reset fs.existsSync to original
    fs.existsSync = originalExistsSync;
  });

  afterEach(() => {
    // Restore original function
    fs.existsSync = originalExistsSync;
  });

  it('should find CODEOWNERS in root directory', () => {
    const workspaceRoot = '/mock/workspace';
    
    fs.existsSync = (filePath) => {
      return filePath === path.join(workspaceRoot, 'CODEOWNERS');
    };

    const result = findCodeownersFile(workspaceRoot);
    assert.strictEqual(result, path.join(workspaceRoot, 'CODEOWNERS'));
  });

  it('should find CODEOWNERS in .github directory', () => {
    const workspaceRoot = '/mock/workspace';
    
    fs.existsSync = (filePath) => {
      return filePath === path.join(workspaceRoot, '.github', 'CODEOWNERS');
    };

    const result = findCodeownersFile(workspaceRoot);
    assert.strictEqual(result, path.join(workspaceRoot, '.github', 'CODEOWNERS'));
  });

  it('should find CODEOWNERS in docs directory', () => {
    const workspaceRoot = '/mock/workspace';
    
    fs.existsSync = (filePath) => {
      return filePath === path.join(workspaceRoot, 'docs', 'CODEOWNERS');
    };

    const result = findCodeownersFile(workspaceRoot);
    assert.strictEqual(result, path.join(workspaceRoot, 'docs', 'CODEOWNERS'));
  });

  it('should prefer root CODEOWNERS over .github', () => {
    const workspaceRoot = '/mock/workspace';
    let callCount = 0;
    
    fs.existsSync = (filePath) => {
      callCount++;
      if (filePath === path.join(workspaceRoot, 'CODEOWNERS')) {
        return true;
      }
      return false;
    };

    const result = findCodeownersFile(workspaceRoot);
    assert.strictEqual(result, path.join(workspaceRoot, 'CODEOWNERS'));
    assert.strictEqual(callCount, 1);
  });

  it('should prefer .github over docs', () => {
    const workspaceRoot = '/mock/workspace';
    let callCount = 0;
    
    fs.existsSync = (filePath) => {
      callCount++;
      if (filePath === path.join(workspaceRoot, '.github', 'CODEOWNERS')) {
        return true;
      }
      return false;
    };

    const result = findCodeownersFile(workspaceRoot);
    assert.strictEqual(result, path.join(workspaceRoot, '.github', 'CODEOWNERS'));
    assert.strictEqual(callCount, 2);
  });

  it('should return undefined when no CODEOWNERS file found', () => {
    const workspaceRoot = '/mock/workspace';
    
    fs.existsSync = () => false;

    const result = findCodeownersFile(workspaceRoot);
    assert.strictEqual(result, undefined);
  });

  it('should handle empty workspace root', () => {
    const result = findCodeownersFile('');
    assert.strictEqual(result, undefined);
  });

  it('should handle undefined workspace root', () => {
    assert.throws(() => {
      findCodeownersFile(undefined);
    }, TypeError);
  });
});
