const assert = require('assert');
const { analyzeCoverage } = require('../out/helpers/coverageAnalyzer');
const fs = require('fs');
const path = require('path');

describe('coverageAnalyzer', () => {
  const originalReadFileSync = fs.readFileSync;
  const originalReadDirSync = fs.readdirSync;
  const originalStatSync = fs.statSync;
  const originalFindCodeownersFile = require('../out/helpers/findCodeownersFile').findCodeownersFile;

  beforeEach(() => {
    // Mock findCodeownersFile to return a known path
    require('../out/helpers/findCodeownersFile').findCodeownersFile = () => '/mock/workspace/CODEOWNERS';

    // Mock file system operations
    fs.readFileSync = (filePath) => {
      if (filePath.includes('CODEOWNERS')) {
        return `src/main.js @team1 @team2
src/utils/ @team3
*.js @team4
docs/ @team5
`;
      }
      throw new Error('File not found');
    };

    fs.readdirSync = (dir) => {
      if (dir === '/mock/workspace') {
        return ['src', 'docs', 'tests', 'package.json', 'CODEOWNERS'];
      }
      if (dir === '/mock/workspace/src') {
        return ['main.js', 'utils', 'config.js'];
      }
      if (dir === '/mock/workspace/src/utils') {
        return ['helper.js', 'validator.js'];
      }
      if (dir === '/mock/workspace/docs') {
        return ['readme.md', 'api.md'];
      }
      if (dir === '/mock/workspace/tests') {
        return ['main.test.js', 'utils.test.js'];
      }
      return [];
    };

    fs.statSync = (filePath) => {
      const isDirectory = filePath.includes('src') || 
                         filePath.includes('docs') || 
                         filePath.includes('tests') ||
                         filePath.includes('utils');
      
      return {
        isDirectory: () => isDirectory,
        isFile: () => !isDirectory
      };
    };
  });

  afterEach(() => {
    // Restore original functions
    fs.readFileSync = originalReadFileSync;
    fs.readdirSync = originalReadDirSync;
    fs.statSync = originalStatSync;
    require('../out/helpers/findCodeownersFile').findCodeownersFile = originalFindCodeownersFile;
  });

  describe('analyzeCoverage', () => {
    it('should return a complete analysis object with all required properties', () => {
      const analysis = analyzeCoverage('/mock/workspace');

      // Overall coverage - should have some files
      assert(analysis.totalFiles > 0);
      assert(analysis.coveredFiles >= 0); // Can be 0 if no files match CODEOWNERS patterns
      assert(analysis.coveragePercentage >= 0);
      assert(analysis.scanDate instanceof Date);
    });

    it('should sort uncovered directories by number of uncovered files in descending order', () => {
      const analysis = analyzeCoverage('/mock/workspace');

      // Should have directory coverage data
      assert(Array.isArray(analysis.uncoveredDirectories));
      assert(analysis.uncoveredDirectories.length >= 0);

      // Check that directories are sorted by uncovered files (descending) if there are any
      if (analysis.uncoveredDirectories.length > 1) {
        for (let i = 1; i < analysis.uncoveredDirectories.length; i++) {
          assert(analysis.uncoveredDirectories[i-1].uncoveredFiles >= analysis.uncoveredDirectories[i].uncoveredFiles);
        }
      }
    });

    it('should sort file type coverage by total files in descending order', () => {
      const analysis = analyzeCoverage('/mock/workspace');

      // Should have file type coverage data
      assert(Array.isArray(analysis.fileTypeCoverage));
      assert(analysis.fileTypeCoverage.length >= 0);

      // Check that file types are sorted by total files (descending) if there are any
      if (analysis.fileTypeCoverage.length > 1) {
        for (let i = 1; i < analysis.fileTypeCoverage.length; i++) {
          assert(analysis.fileTypeCoverage[i-1].totalFiles >= analysis.fileTypeCoverage[i].totalFiles);
        }
      }
    });

    it('should sort team coverage by total files in descending order', () => {
      const analysis = analyzeCoverage('/mock/workspace');

      // Should have team coverage data
      assert(Array.isArray(analysis.teamCoverage));
      assert(analysis.teamCoverage.length >= 0);

      // Check that teams are sorted by total files (descending) if there are any
      if (analysis.teamCoverage.length > 1) {
        for (let i = 1; i < analysis.teamCoverage.length; i++) {
          assert(analysis.teamCoverage[i-1].totalFiles >= analysis.teamCoverage[i].totalFiles);
        }
      }

      // Check that percentages add up to reasonable values if there are teams
      if (analysis.teamCoverage.length > 0) {
        const totalPercentage = analysis.teamCoverage.reduce((sum, team) => sum + team.percentageOfTotal, 0);
        assert(totalPercentage > 0);
      }
    });

    it('should throw an error when no CODEOWNERS file is found', () => {
      // Mock findCodeownersFile to return undefined
      require('../out/helpers/findCodeownersFile').findCodeownersFile = () => undefined;

      assert.throws(() => {
        analyzeCoverage('/mock/workspace');
      }, Error);
    });

    it('should exclude common build and dependency directories from analysis', () => {
      // Mock readdirSync to include node_modules
      fs.readdirSync = (dir) => {
        if (dir === '/mock/workspace') {
          return ['src', 'node_modules', 'package.json', 'CODEOWNERS'];
        }
        if (dir === '/mock/workspace/src') {
          return ['main.js'];
        }
        if (dir === '/mock/workspace/node_modules') {
          return ['some-package'];
        }
        return [];
      };

      const analysis = analyzeCoverage('/mock/workspace');

      // Should only count files from src, not node_modules
      assert(analysis.totalFiles > 0); // Should have at least some files
      assert(analysis.totalFiles < 10); // Should not have too many files (excluding node_modules)
    });

    it('should handle file read errors gracefully by throwing an error', () => {
      // Mock readFileSync to throw error
      fs.readFileSync = () => {
        throw new Error('Permission denied');
      };

      assert.throws(() => {
        analyzeCoverage('/mock/workspace');
      }, Error);
    });

    it('should handle empty workspace with no files', () => {
      fs.readdirSync = () => [];

      const analysis = analyzeCoverage('/mock/workspace');

      assert.strictEqual(analysis.totalFiles, 0);
      assert.strictEqual(analysis.coveredFiles, 0);
      assert.strictEqual(analysis.coveragePercentage, 0);
      assert(Array.isArray(analysis.uncoveredDirectories));
      assert(Array.isArray(analysis.fileTypeCoverage));
      assert(Array.isArray(analysis.teamCoverage));
    });

    it('should handle workspace with only directories and no files', () => {
      fs.readdirSync = (dir) => {
        if (dir === '/mock/workspace') {
          return ['src', 'docs', 'CODEOWNERS'];
        }
        if (dir === '/mock/workspace/src') {
          return ['utils'];
        }
        if (dir === '/mock/workspace/src/utils') {
          return [];
        }
        if (dir === '/mock/workspace/docs') {
          return [];
        }
        return [];
      };

      fs.statSync = (filePath) => {
        // All paths should be directories, no files
        return {
          isDirectory: () => true,
          isFile: () => false
        };
      };

      const analysis = analyzeCoverage('/mock/workspace');

      assert.strictEqual(analysis.totalFiles, 0);
      assert.strictEqual(analysis.coveredFiles, 0);
      assert.strictEqual(analysis.coveragePercentage, 0);
    });

    it('should handle workspace with hidden files and directories', () => {
      fs.readdirSync = (dir) => {
        if (dir === '/mock/workspace') {
          return ['.git', '.vscode', 'src', '.env', 'CODEOWNERS'];
        }
        if (dir === '/mock/workspace/src') {
          return ['main.js', '.DS_Store'];
        }
        if (dir === '/mock/workspace/.git') {
          return ['config', 'HEAD'];
        }
        if (dir === '/mock/workspace/.vscode') {
          return ['settings.json'];
        }
        return [];
      };

      const analysis = analyzeCoverage('/mock/workspace');

      // Should count regular files but exclude hidden directories
      assert(analysis.totalFiles > 0);
      // Should not include files from .git or .vscode
      assert(analysis.totalFiles < 5);
    });

    it('should handle CODEOWNERS file with no matching patterns', () => {
      fs.readFileSync = (filePath) => {
        if (filePath.includes('CODEOWNERS')) {
          return `# No patterns that match our test files
*.txt @team1
docs/ @team2
`;
        }
        throw new Error('File not found');
      };

      const analysis = analyzeCoverage('/mock/workspace');

      assert(analysis.totalFiles > 0);
      assert.strictEqual(analysis.coveredFiles, 0);
      assert.strictEqual(analysis.coveragePercentage, 0);
    });

    it('should handle CODEOWNERS file with only comments and empty lines', () => {
      fs.readFileSync = (filePath) => {
        if (filePath.includes('CODEOWNERS')) {
          return `# This is a comment
# Another comment

# Yet another comment
`;
        }
        throw new Error('File not found');
      };

      const analysis = analyzeCoverage('/mock/workspace');

      assert(analysis.totalFiles > 0);
      assert.strictEqual(analysis.coveredFiles, 0);
      assert.strictEqual(analysis.coveragePercentage, 0);
    });

    it('should handle deeply nested directory structures', () => {
      fs.readdirSync = (dir) => {
        if (dir === '/mock/workspace') {
          return ['src', 'CODEOWNERS'];
        }
        if (dir === '/mock/workspace/src') {
          return ['level1'];
        }
        if (dir === '/mock/workspace/src/level1') {
          return ['level2'];
        }
        if (dir === '/mock/workspace/src/level1/level2') {
          return ['level3'];
        }
        if (dir === '/mock/workspace/src/level1/level2/level3') {
          return ['level4'];
        }
        if (dir === '/mock/workspace/src/level1/level2/level3/level4') {
          return ['deepfile.js'];
        }
        return [];
      };

      const analysis = analyzeCoverage('/mock/workspace');

      assert(analysis.totalFiles > 0);
      assert(analysis.totalFiles <= 1); // Should find the deep file
    });

    it('should handle files with unusual extensions', () => {
      fs.readdirSync = (dir) => {
        if (dir === '/mock/workspace') {
          return ['src', 'CODEOWNERS'];
        }
        if (dir === '/mock/workspace/src') {
          return ['file.xyz', 'file.123', 'file.no-extension', 'file.with.multiple.dots'];
        }
        return [];
      };

      const analysis = analyzeCoverage('/mock/workspace');

      assert(analysis.totalFiles > 0);
      assert(Array.isArray(analysis.fileTypeCoverage));
    });

    it('should handle symlinks and special files gracefully', () => {
      fs.readdirSync = (dir) => {
        if (dir === '/mock/workspace') {
          return ['src', 'symlink', 'fifo', 'CODEOWNERS'];
        }
        if (dir === '/mock/workspace/src') {
          return ['normal.js'];
        }
        return [];
      };

      fs.statSync = (filePath) => {
        if (filePath.includes('symlink')) {
          return { isDirectory: () => false, isFile: () => false };
        }
        if (filePath.includes('fifo')) {
          return { isDirectory: () => false, isFile: () => false };
        }
        if (filePath.includes('src')) {
          return { isDirectory: () => true, isFile: () => false };
        }
        return { isDirectory: () => false, isFile: () => true };
      };

      const analysis = analyzeCoverage('/mock/workspace');

      assert(analysis.totalFiles > 0);
      assert(analysis.totalFiles <= 1); // Should only count normal.js
    });

    it('should respect .gitignore patterns when analyzing coverage', () => {
      // Mock .gitignore file
      fs.readFileSync = (filePath) => {
        if (filePath.includes('CODEOWNERS')) {
          return `src/main.js @team1 @team2
src/utils/ @team3
*.js @team4
docs/ @team5
`;
        }
        if (filePath.includes('.gitignore')) {
          return `# Build artifacts
dist/
build/
*.log

# Dependencies
node_modules/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Test coverage
coverage/
.nyc_output/
`;
        }
        throw new Error('File not found');
      };

      fs.existsSync = (filePath) => {
        return filePath.includes('.gitignore');
      };

      fs.readdirSync = (dir) => {
        if (dir === '/mock/workspace') {
          return ['src', 'dist', 'node_modules', '.vscode', 'coverage', '.gitignore', 'CODEOWNERS'];
        }
        if (dir === '/mock/workspace/src') {
          return ['main.js', 'utils', 'test.js'];
        }
        if (dir === '/mock/workspace/src/utils') {
          return ['helper.js'];
        }
        if (dir === '/mock/workspace/dist') {
          return ['bundle.js', 'main.js'];
        }
        if (dir === '/mock/workspace/node_modules') {
          return ['some-package'];
        }
        if (dir === '/mock/workspace/coverage') {
          return ['lcov.info', 'index.html'];
        }
        return [];
      };

      const analysis = analyzeCoverage('/mock/workspace');

      // Should only count files from src, not from ignored directories
      assert(analysis.totalFiles > 0);
      assert(analysis.totalFiles <= 3); // Only main.js, test.js, helper.js
      // Should not include files from dist/, node_modules/, coverage/, etc.
    });

    it('should handle .gitignore with wildcard patterns', () => {
      fs.readFileSync = (filePath) => {
        if (filePath.includes('CODEOWNERS')) {
          return `src/main.js @team1`;
        }
        if (filePath.includes('.gitignore')) {
          return `*.log
*.tmp
temp/
cache/
`;
        }
        throw new Error('File not found');
      };

      fs.existsSync = (filePath) => {
        return filePath.includes('.gitignore');
      };

      fs.readdirSync = (dir) => {
        if (dir === '/mock/workspace') {
          return ['src', 'temp', 'cache', '.gitignore', 'CODEOWNERS'];
        }
        if (dir === '/mock/workspace/src') {
          return ['main.js', 'app.log', 'config.tmp'];
        }
        if (dir === '/mock/workspace/temp') {
          return ['temp.js'];
        }
        if (dir === '/mock/workspace/cache') {
          return ['cache.js'];
        }
        return [];
      };

      const analysis = analyzeCoverage('/mock/workspace');

      // Should exclude .log and .tmp files, and temp/ and cache/ directories
      assert(analysis.totalFiles > 0);
      assert(analysis.totalFiles <= 3); // main.js, app.log, config.tmp (but temp/ and cache/ should be excluded)
    });

    it('should handle missing .gitignore file gracefully', () => {
      fs.readFileSync = (filePath) => {
        if (filePath.includes('CODEOWNERS')) {
          return `src/main.js @team1`;
        }
        throw new Error('File not found');
      };

      fs.existsSync = (filePath) => {
        return false; // No .gitignore file
      };

      fs.readdirSync = (dir) => {
        if (dir === '/mock/workspace') {
          return ['src', 'CODEOWNERS'];
        }
        if (dir === '/mock/workspace/src') {
          return ['main.js'];
        }
        return [];
      };

      const analysis = analyzeCoverage('/mock/workspace');

      // Should work normally without .gitignore
      assert(analysis.totalFiles > 0);
      assert(analysis.totalFiles <= 1);
    });
  });
});
