const assert = require('assert');
const { findBestMatch, pathMatches, isMoreSpecific, findOwnersForFile } = require('../out/helpers/pathMatcher');

describe('pathMatcher', () => {
  describe('pathMatches', () => {
    it('matches identical file paths exactly', () => {
      assert.strictEqual(pathMatches('src/main.js', 'src/main.js'), true);
      assert.strictEqual(pathMatches('src/main.js', 'src/other.js'), false);
    });

    it('matches files using wildcard patterns', () => {
      assert.strictEqual(pathMatches('main.js', '*'), true);
      assert.strictEqual(pathMatches('file.txt', '*'), true);
      assert.strictEqual(pathMatches('src/main.js', '*'), false); // * only matches current directory
    });

    it('matches files within directory patterns', () => {
      assert.strictEqual(pathMatches('src/main.js', 'src/'), true);
      assert.strictEqual(pathMatches('src/utils/helper.js', 'src/'), true);
      assert.strictEqual(pathMatches('src', 'src/'), true);
      assert.strictEqual(pathMatches('docs/readme.md', 'src/'), false);
    });

    it('matches files using glob patterns', () => {
      assert.strictEqual(pathMatches('main.js', '*.js'), true);
      assert.strictEqual(pathMatches('main.ts', '*.js'), false);
      assert.strictEqual(pathMatches('src/main.js', 'src/*.js'), true);
      assert.strictEqual(pathMatches('docs/main.js', 'src/*.js'), false);
      assert.strictEqual(pathMatches('src/utils/helper.js', '**/*.js'), true); // Use ** for recursive
    });

    it('treats escaped special characters as literals', () => {
      assert.strictEqual(pathMatches('src/main.js', 'src/main.js'), true);
      assert.strictEqual(pathMatches('src/main.js', 'src/main\\.js'), false); // escaped dot
    });
  });

  describe('isMoreSpecific', () => {
    it('considers deeper paths more specific than shallower ones', () => {
      assert.strictEqual(isMoreSpecific('src/utils/helper.js', 'src/'), true);
      assert.strictEqual(isMoreSpecific('src/', 'src/utils/helper.js'), false);
    });

    it('treats paths at the same depth as equally specific', () => {
      assert.strictEqual(isMoreSpecific('src/main.js', 'src/other.js'), false);
      assert.strictEqual(isMoreSpecific('src/other.js', 'src/main.js'), false);
    });

    it('considers paths with more segments more specific', () => {
      assert.strictEqual(isMoreSpecific('src/main.js', 'main.js'), true);
      assert.strictEqual(isMoreSpecific('main.js', 'src/main.js'), false);
    });

    it('prefers exact file paths over directory patterns', () => {
      assert.strictEqual(isMoreSpecific('src/main.js', 'src/'), true);
      assert.strictEqual(isMoreSpecific('src/', 'src/main.js'), false);
    });

    it('prefers exact file paths over wildcard patterns', () => {
      assert.strictEqual(isMoreSpecific('src/main.js', '*.js'), true);
      assert.strictEqual(isMoreSpecific('*.js', 'src/main.js'), false);
    });

    it('prefers file patterns over directory patterns', () => {
      assert.strictEqual(isMoreSpecific('src/*.js', 'src/'), true);
      assert.strictEqual(isMoreSpecific('src/', 'src/*.js'), false);
    });

    it('prefers non-recursive over recursive patterns', () => {
      assert.strictEqual(isMoreSpecific('src/*.js', 'src/**/*.js'), true);
      assert.strictEqual(isMoreSpecific('src/**/*.js', 'src/*.js'), false);
    });

    it('prefers exact extensions over brace expansions', () => {
      assert.strictEqual(isMoreSpecific('src/*.js', 'src/*.{js,ts}'), true);
      assert.strictEqual(isMoreSpecific('src/*.{js,ts}', 'src/*.js'), false);
    });

    it('prefers patterns with more literal characters', () => {
      assert.strictEqual(isMoreSpecific('src/component*.js', 'src/*.js'), true);
      assert.strictEqual(isMoreSpecific('src/*.js', 'src/component*.js'), false);
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

    it('finds exact file path matches', () => {
      const result = findBestMatch('src/main.js', sampleCodeowners);
      assert.deepStrictEqual(result, { path: 'src/main.js', owners: ['@team1', '@team2'] });
    });

    it('finds directory pattern matches', () => {
      const result = findBestMatch('src/utils/helper.js', sampleCodeowners);
      assert.deepStrictEqual(result, { path: 'src/utils/', owners: ['@team3'] });
    });

    it('finds the most specific match when multiple patterns apply', () => {
      const result = findBestMatch('src/main.js', sampleCodeowners);
      assert.deepStrictEqual(result, { path: 'src/main.js', owners: ['@team1', '@team2'] });
    });

    it('finds glob pattern matches', () => {
      const result = findBestMatch('other.js', sampleCodeowners);
      assert.deepStrictEqual(result, { path: '*.js', owners: ['@team4'] });
    });

    it('returns null when no patterns match', () => {
      const result = findBestMatch('unknown/file.txt', sampleCodeowners);
      assert.strictEqual(result, null);
    });

    it('returns null for empty CODEOWNERS content', () => {
      const result = findBestMatch('src/main.js', '');
      assert.strictEqual(result, null);
    });

    it('returns null when CODEOWNERS contains only comments', () => {
      const result = findBestMatch('src/main.js', '# Only comments\n# No rules');
      assert.strictEqual(result, null);
    });

    it('selects the most specific pattern when multiple patterns match', () => {
      const specificCodeowners = `
src/utils/ @team1
src/utils/helper.js @team2
*.js @team3
`;
      const result = findBestMatch('src/utils/helper.js', specificCodeowners);
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

    it('returns owners when file matches a CODEOWNERS pattern', () => {
      const owners = findOwnersForFile('src/main.js', '/mock/workspace');
      assert.deepStrictEqual(owners, ['@team1', '@team2']);
    });

    it('returns empty array when CODEOWNERS file does not exist', () => {
      require('../out/helpers/findCodeownersFile').findCodeownersFile = () => undefined;
      
      const owners = findOwnersForFile('src/main.js', '/mock/workspace');
      assert.deepStrictEqual(owners, []);
    });

    it('returns empty array when CODEOWNERS file cannot be read', () => {
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

    it('returns empty array when file does not match any CODEOWNERS patterns', () => {
      const owners = findOwnersForFile('unknown/file.txt', '/mock/workspace');
      assert.deepStrictEqual(owners, []);
    });
  });
});
