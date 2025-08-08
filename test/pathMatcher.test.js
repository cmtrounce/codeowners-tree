const assert = require('assert');
const { findBestMatch, pathMatches, isMoreSpecific, findOwnersForFile } = require('../out/helpers/pathMatcher');

describe('pathMatcher', () => {
  describe('pathMatches', () => {
    it('should match exact paths', () => {
      assert.strictEqual(pathMatches('src/main.js', 'src/main.js'), true);
      assert.strictEqual(pathMatches('src/main.js', 'src/other.js'), false);
    });

    it('should match wildcard patterns', () => {
      assert.strictEqual(pathMatches('src/main.js', '*'), true);
      assert.strictEqual(pathMatches('any/file/path.txt', '*'), true);
    });

    it('should match directory patterns', () => {
      assert.strictEqual(pathMatches('src/main.js', 'src/'), true);
      assert.strictEqual(pathMatches('src/utils/helper.js', 'src/'), true);
      assert.strictEqual(pathMatches('src', 'src/'), true);
      assert.strictEqual(pathMatches('docs/readme.md', 'src/'), false);
    });

    it('should match glob patterns', () => {
      assert.strictEqual(pathMatches('src/main.js', '*.js'), true);
      assert.strictEqual(pathMatches('src/utils/helper.js', '*.js'), true);
      assert.strictEqual(pathMatches('src/main.ts', '*.js'), false);
      assert.strictEqual(pathMatches('src/main.js', 'src/*.js'), true);
      assert.strictEqual(pathMatches('docs/main.js', 'src/*.js'), false);
    });

    it('should handle special characters in glob patterns', () => {
      assert.strictEqual(pathMatches('src/main.js', 'src/main.js'), true);
      assert.strictEqual(pathMatches('src/main.js', 'src/main\\.js'), false); // escaped dot
    });
  });

  describe('isMoreSpecific', () => {
    it('should consider longer paths more specific', () => {
      assert.strictEqual(isMoreSpecific('src/utils/helper.js', 'src/'), true);
      assert.strictEqual(isMoreSpecific('src/', 'src/utils/helper.js'), false);
    });

    it('should handle same depth paths', () => {
      assert.strictEqual(isMoreSpecific('src/main.js', 'src/other.js'), false);
      assert.strictEqual(isMoreSpecific('src/other.js', 'src/main.js'), false);
    });

    it('should handle root level paths', () => {
      assert.strictEqual(isMoreSpecific('src/main.js', 'main.js'), true);
      assert.strictEqual(isMoreSpecific('main.js', 'src/main.js'), false);
    });

    it('should prefer exact matches over directory matches', () => {
      assert.strictEqual(isMoreSpecific('src/main.js', 'src/'), true);
      assert.strictEqual(isMoreSpecific('src/', 'src/main.js'), false);
    });

    it('should prefer exact matches over wildcard matches', () => {
      assert.strictEqual(isMoreSpecific('src/main.js', '*.js'), true);
      assert.strictEqual(isMoreSpecific('*.js', 'src/main.js'), false);
    });
  });

  describe('findBestMatch', () => {
    const sampleCodeowners = `
# Sample CODEOWNERS file
src/main.js @team1 @team2
src/utils/ @team3
*.js @team4
docs/ @team5
`;

    it('should find exact matches', () => {
      const result = findBestMatch('src/main.js', sampleCodeowners);
      assert.deepStrictEqual(result, { path: 'src/main.js', owners: ['@team1', '@team2'] });
    });

    it('should find directory matches', () => {
      const result = findBestMatch('src/utils/helper.js', sampleCodeowners);
      assert.deepStrictEqual(result, { path: 'src/utils/', owners: ['@team3'] });
    });

    it('should find wildcard matches', () => {
      const result = findBestMatch('src/main.js', sampleCodeowners);
      // Should prefer exact match over wildcard
      assert.deepStrictEqual(result, { path: 'src/main.js', owners: ['@team1', '@team2'] });
    });

    it('should find glob pattern matches', () => {
      const result = findBestMatch('src/other.js', sampleCodeowners);
      assert.deepStrictEqual(result, { path: '*.js', owners: ['@team4'] });
    });

    it('should return null for no matches', () => {
      const result = findBestMatch('unknown/file.txt', sampleCodeowners);
      assert.strictEqual(result, null);
    });

    it('should handle empty content', () => {
      const result = findBestMatch('src/main.js', '');
      assert.strictEqual(result, null);
    });

    it('should handle content with only comments', () => {
      const result = findBestMatch('src/main.js', '# Only comments\n# No rules');
      assert.strictEqual(result, null);
    });

    it('should prefer more specific matches', () => {
      const specificCodeowners = `
src/utils/ @team1
src/utils/helper.js @team2
*.js @team3
`;
      const result = findBestMatch('src/utils/helper.js', specificCodeowners);
      // Should prefer 'src/utils/helper.js' (depth 3) over 'src/utils/' (depth 2)
      assert.deepStrictEqual(result, { path: 'src/utils/helper.js', owners: ['@team2'] });
    });
  });

  describe('findOwnersForFile', () => {
    // Mock the dependencies for testing
    const originalFindCodeownersFile = require('../out/helpers/findCodeownersFile').findCodeownersFile;
    const originalFs = require('fs');

    beforeEach(() => {
      // Mock findCodeownersFile to return a known path
      require('../out/helpers/findCodeownersFile').findCodeownersFile = () => '/mock/CODEOWNERS';
      
      // Mock fs.readFileSync
      require('fs').readFileSync = (path, encoding) => {
        if (path === '/mock/CODEOWNERS') {
          return 'src/main.js @team1 @team2\nsrc/utils/ @team3\n*.js @team4';
        }
        throw new Error('File not found');
      };
    });

    afterEach(() => {
      // Restore original functions
      require('../out/helpers/findCodeownersFile').findCodeownersFile = originalFindCodeownersFile;
      require('fs').readFileSync = originalFs.readFileSync;
    });

    it('should find owners for existing file', () => {
      const owners = findOwnersForFile('src/main.js', '/mock/workspace');
      assert.deepStrictEqual(owners, ['@team1', '@team2']);
    });

    it('should return empty array when no CODEOWNERS file found', () => {
      require('../out/helpers/findCodeownersFile').findCodeownersFile = () => undefined;
      
      const owners = findOwnersForFile('src/main.js', '/mock/workspace');
      assert.deepStrictEqual(owners, []);
    });

    it('should return empty array when file read fails', () => {
      // Suppress console.error for this test
      const originalConsoleError = console.error;
      console.error = () => {}; // Suppress error output
      
      require('fs').readFileSync = () => {
        throw new Error('Permission denied');
      };
      
      const owners = findOwnersForFile('src/main.js', '/mock/workspace');
      assert.deepStrictEqual(owners, []);
      
      // Restore console.error
      console.error = originalConsoleError;
    });

    it('should return empty array when no match found', () => {
      const owners = findOwnersForFile('unknown/file.txt', '/mock/workspace');
      assert.deepStrictEqual(owners, []);
    });
  });
});
