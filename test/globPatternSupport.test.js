const assert = require('assert');
const { findBestMatch, pathMatches, isMoreSpecific, findOwnersForFile } = require('../out/helpers/pathMatcher');

describe('glob pattern support', () => {
  describe('single asterisk (*)', () => {
    it('matches files in the current directory only', () => {
      assert.strictEqual(pathMatches('main.js', '*'), true);
      assert.strictEqual(pathMatches('README.md', '*'), true);
      assert.strictEqual(pathMatches('src/main.js', '*'), false); // Does not cross directory boundaries
    });

    it('matches files within a specific directory', () => {
      assert.strictEqual(pathMatches('src/main.js', 'src/*'), true);
      assert.strictEqual(pathMatches('src/utils.js', 'src/*'), true);
      assert.strictEqual(pathMatches('docs/README.md', 'src/*'), false);
    });

    it('matches files by extension', () => {
      assert.strictEqual(pathMatches('main.js', '*.js'), true);
      assert.strictEqual(pathMatches('utils.ts', '*.ts'), true);
      assert.strictEqual(pathMatches('main.js', '*.ts'), false);
    });

    it('matches files by extension within a directory', () => {
      assert.strictEqual(pathMatches('src/main.js', 'src/*.js'), true);
      assert.strictEqual(pathMatches('src/utils.js', 'src/*.js'), true);
      assert.strictEqual(pathMatches('docs/main.js', 'src/*.js'), false);
    });
  });

  describe('double asterisk (**)', () => {
    it('matches files recursively across any number of subdirectories', () => {
      assert.strictEqual(pathMatches('src/main.js', '**/*.js'), true);
      assert.strictEqual(pathMatches('src/utils/helper.js', '**/*.js'), true);
      assert.strictEqual(pathMatches('src/deep/nested/file.js', '**/*.js'), true);
      assert.strictEqual(pathMatches('docs/api.js', '**/*.js'), true);
    });

    it('matches files recursively within a specific directory tree', () => {
      assert.strictEqual(pathMatches('src/main.js', 'src/**/*.js'), true);
      assert.strictEqual(pathMatches('src/utils/helper.js', 'src/**/*.js'), true);
      assert.strictEqual(pathMatches('docs/main.js', 'src/**/*.js'), false);
    });

    it('matches files in directories at any depth with a specific name', () => {
      assert.strictEqual(pathMatches('src/components/Button.js', '**/components/*.js'), true);
      assert.strictEqual(pathMatches('src/pages/home/Header.js', '**/components/*.js'), false);
    });

    it('matches all files within a directory tree', () => {
      assert.strictEqual(pathMatches('src/components/Button.js', 'src/**'), true);
      assert.strictEqual(pathMatches('src/utils/helper.js', 'src/**'), true);
      assert.strictEqual(pathMatches('docs/README.md', 'src/**'), false);
    });
  });

  describe('question mark (?)', () => {
    it('matches exactly one character', () => {
      assert.strictEqual(pathMatches('main1.js', 'main?.js'), true);
      assert.strictEqual(pathMatches('maina.js', 'main?.js'), true);
      assert.strictEqual(pathMatches('main.js', 'main?.js'), false); // ? requires exactly one character
      assert.strictEqual(pathMatches('main12.js', 'main?.js'), false);
    });

    it('matches single characters in directory names', () => {
      assert.strictEqual(pathMatches('src1/main.js', 'src?/main.js'), true);
      assert.strictEqual(pathMatches('src2/main.js', 'src?/main.js'), true);
      assert.strictEqual(pathMatches('src12/main.js', 'src?/main.js'), false);
    });

    it('does not match path separators', () => {
      assert.strictEqual(pathMatches('src/main.js', 'src?main.js'), false);
      assert.strictEqual(pathMatches('src1main.js', 'src?main.js'), true); // ? matches the '1'
      assert.strictEqual(pathMatches('src/main.js', 'src?/main.js'), false); // ? can't match nothing
      assert.strictEqual(pathMatches('src1/main.js', 'src?/main.js'), true); // ? matches the '1'
    });
  });

  describe('character classes [abc]', () => {
    it('matches a single character from the specified set', () => {
      assert.strictEqual(pathMatches('main.js', 'main[abc].js'), false);
      assert.strictEqual(pathMatches('maina.js', 'main[abc].js'), true);
      assert.strictEqual(pathMatches('mainb.js', 'main[abc].js'), true);
      assert.strictEqual(pathMatches('mainc.js', 'main[abc].js'), true);
      assert.strictEqual(pathMatches('maind.js', 'main[abc].js'), false);
    });

    it('matches character ranges', () => {
      assert.strictEqual(pathMatches('main1.js', 'main[0-9].js'), true);
      assert.strictEqual(pathMatches('main5.js', 'main[0-9].js'), true);
      assert.strictEqual(pathMatches('maina.js', 'main[0-9].js'), false);
      assert.strictEqual(pathMatches('mainA.js', 'main[A-Z].js'), true);
      assert.strictEqual(pathMatches('mainz.js', 'main[a-z].js'), true);
    });

    it('matches negated character classes', () => {
      assert.strictEqual(pathMatches('main1.js', 'main[!abc].js'), true);
      assert.strictEqual(pathMatches('maina.js', 'main[!abc].js'), false);
      assert.strictEqual(pathMatches('mainb.js', 'main[!abc].js'), false);
      assert.strictEqual(pathMatches('maind.js', 'main[!abc].js'), true);
    });

    it('escapes special characters within classes', () => {
      assert.strictEqual(pathMatches('main[.js', 'main[\\[].js'), true);
      assert.strictEqual(pathMatches('main].js', 'main[\\]].js'), true);
    });
  });

  describe('brace expansion {a,b,c}', () => {
    it('matches any of the specified alternatives', () => {
      assert.strictEqual(pathMatches('main.js', 'main.{js,ts}'), true);
      assert.strictEqual(pathMatches('main.ts', 'main.{js,ts}'), true);
      assert.strictEqual(pathMatches('main.py', 'main.{js,ts}'), false);
    });

    it('matches complex alternatives with multiple parts', () => {
      assert.strictEqual(pathMatches('src/components/Button.jsx', 'src/{components,pages}/*.{js,jsx,ts,tsx}'), true);
      assert.strictEqual(pathMatches('src/pages/Home.tsx', 'src/{components,pages}/*.{js,jsx,ts,tsx}'), true);
      assert.strictEqual(pathMatches('src/utils/helper.js', 'src/{components,pages}/*.{js,jsx,ts,tsx}'), false);
    });

    it('matches nested brace expansions', () => {
      assert.strictEqual(pathMatches('src/test.spec.js', 'src/*.{test,spec}.{js,ts}'), true);
      assert.strictEqual(pathMatches('src/test.spec.ts', 'src/*.{test,spec}.{js,ts}'), true);
      assert.strictEqual(pathMatches('src/main.js', 'src/*.{test,spec}.{js,ts}'), false);
    });
  });
});

describe('glob pattern edge cases', () => {
  describe('escaping special characters', () => {
    it('treats escaped asterisks as literal characters', () => {
      assert.strictEqual(pathMatches('src/main*.js', 'src/main\\*.js'), true);
      assert.strictEqual(pathMatches('src/main.js', 'src/main\\*.js'), false);
    });

    it('treats escaped question marks as literal characters', () => {
      assert.strictEqual(pathMatches('src/main?.js', 'src/main\\?.js'), true);
      assert.strictEqual(pathMatches('src/main1.js', 'src/main\\?.js'), false);
    });

    it('treats escaped brackets as literal characters', () => {
      assert.strictEqual(pathMatches('src/main[abc].js', 'src/main\\[abc\\].js'), true);
      assert.strictEqual(pathMatches('src/maina.js', 'src/main\\[abc\\].js'), false);
    });

    it('treats escaped braces as literal characters', () => {
      assert.strictEqual(pathMatches('src/main{a,b}.js', 'src/main\\{a,b\\}.js'), true);
      assert.strictEqual(pathMatches('src/maina.js', 'src/main\\{a,b\\}.js'), false);
    });
  });

  describe('mixed patterns', () => {
    it('combines multiple glob features in complex patterns', () => {
      assert.strictEqual(pathMatches('src/components/Button.test.jsx', 'src/**/[BC]*.{test,spec}.{js,jsx,ts,tsx}'), true);
      assert.strictEqual(pathMatches('src/pages/Card.spec.tsx', 'src/**/[BC]*.{test,spec}.{js,jsx,ts,tsx}'), true);
      assert.strictEqual(pathMatches('src/utils/helper.test.js', 'src/**/[BC]*.{test,spec}.{js,jsx,ts,tsx}'), false);
    });

    it('matches patterns with spaces when properly escaped', () => {
      assert.strictEqual(pathMatches('src/my component/Button.js', 'src/**/my\\ component/*.js'), true);
      assert.strictEqual(pathMatches('src/mycomponent/Button.js', 'src/**/my\\ component/*.js'), false);
    });
  });

  describe('unicode and special characters', () => {
    it('matches unicode characters in file names', () => {
      assert.strictEqual(pathMatches('src/café.js', 'src/*.js'), true);
      assert.strictEqual(pathMatches('src/测试.js', 'src/*.js'), true);
    });

    it('matches emoji characters in file names', () => {
      assert.strictEqual(pathMatches('src/🚀rocket.js', 'src/*.js'), true);
      assert.strictEqual(pathMatches('src/component-💯.js', 'src/*-*.js'), true);
    });
  });
});

describe('pattern precedence and specificity', () => {
  describe('exact vs glob patterns', () => {
    it('prefers exact file paths over glob patterns', () => {
      const codeowners = `
*.js @glob-team
src/main.js @exact-team
`;
      const result = findBestMatch('src/main.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/main.js', owners: ['@exact-team'] });
    });

    it('prefers more specific glob patterns over general ones', () => {
      const codeowners = `
src/**/*.js @recursive-team
src/utils/*.js @utils-team
src/utils/helper.js @specific-team
`;
      const result = findBestMatch('src/utils/helper.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/utils/helper.js', owners: ['@specific-team'] });
    });
  });

  describe('pattern complexity precedence', () => {
    it('prefers non-recursive patterns over recursive patterns', () => {
      const codeowners = `
src/**/*.{js,ts,jsx,tsx} @complex-team
src/**/*.js @js-team
src/*.js @simple-team
`;
      const result = findBestMatch('src/main.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/*.js', owners: ['@simple-team'] });
    });

    it('prefers patterns without recursive wildcards', () => {
      const codeowners = `
**/*.js @global-team
src/**/*.js @recursive-team
src/*.js @direct-team
`;
      const result = findBestMatch('src/main.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/*.js', owners: ['@direct-team'] });
    });

    it('prefers specific file types over multiple alternatives', () => {
      const codeowners = `
src/**/* @all-files-team
src/**/*.{js,ts,jsx,tsx} @web-files-team
src/**/*.js @js-files-team
`;
      const result = findBestMatch('src/utils/helper.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/**/*.js', owners: ['@js-files-team'] });
    });

    it('prefers exact paths over any glob patterns', () => {
      const codeowners = `
src/**/*.js @recursive-team
src/*.js @direct-team
src/main.js @exact-team
`;
      const result = findBestMatch('src/main.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/main.js', owners: ['@exact-team'] });
    });

    it('prefers file patterns over directory patterns', () => {
      const codeowners = `
src/ @directory-team
src/*.js @file-pattern-team
`;
      const result = findBestMatch('src/main.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/*.js', owners: ['@file-pattern-team'] });
    });

    it('prefers character classes over single wildcards', () => {
      const codeowners = `
src/*.js @wildcard-team
src/[abc].js @charclass-team
`;
      const result = findBestMatch('src/a.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/[abc].js', owners: ['@charclass-team'] });
    });

    it('prefers patterns with fewer alternatives', () => {
      const codeowners = `
src/{a,b,c}.js @three-options-team
src/{a,b}.{js,ts} @four-options-team
`;
      const result = findBestMatch('src/a.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/{a,b,c}.js', owners: ['@three-options-team'] });
    });

    it('prefers patterns with more literal characters', () => {
      const codeowners = `
src/*.js @short-team
src/component*.js @longer-team
`;
      const result = findBestMatch('src/component.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/component*.js', owners: ['@longer-team'] });
    });

    it('uses path depth as final tiebreaker', () => {
      const codeowners = `
*.js @root-team
src/*.js @src-team
`;
      const result = findBestMatch('src/main.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/*.js', owners: ['@src-team'] });
    });
  });
});

describe('lexicographic comparison edge cases', () => {
  describe('question marks vs other patterns', () => {
    it('prefers question marks over wildcards for single character matching', () => {
      const codeowners = `
src/*.js @wildcard-team
src/?.js @question-team
`;
      const result = findBestMatch('src/a.js', codeowners);
      // Question mark is more specific than wildcard (single char vs any chars)
      assert.deepStrictEqual(result, { path: 'src/?.js', owners: ['@question-team'] });
    });

    it('prefers character classes over question marks for exact character matching', () => {
      const codeowners = `
src/[a].js @charclass-team
src/?.js @question-team
`;
      const result = findBestMatch('src/a.js', codeowners);
      // Character class [a] is more specific than ? (exact char vs any char)
      assert.deepStrictEqual(result, { path: 'src/[a].js', owners: ['@charclass-team'] });
    });
  });

  describe('file extension specificity', () => {
    it('prefers exact extensions over pattern extensions', () => {
      const codeowners = `
src/*.{js,ts} @pattern-ext-team
src/*.js @exact-ext-team
`;
      const result = findBestMatch('src/main.js', codeowners);
      assert.deepStrictEqual(result, { path: 'src/*.js', owners: ['@exact-ext-team'] });
    });

    it('matches files without extensions appropriately', () => {
      const codeowners = `
src/* @no-ext-team
src/*.js @with-ext-team
`;
      const result = findBestMatch('src/Makefile', codeowners);
      assert.deepStrictEqual(result, { path: 'src/*', owners: ['@no-ext-team'] });
    });
  });

  describe('complex pattern combinations', () => {
    it('prioritizes non-recursive patterns over complex recursive ones', () => {
      const codeowners = `
src/**/{components,pages}/*.{js,tsx} @complex-team
src/**/components/*.js @simpler-team
src/components/*.js @simplest-team
`;
      const result = findBestMatch('src/components/Button.js', codeowners);
      // Non-recursive should win over recursive
      assert.deepStrictEqual(result, { path: 'src/components/*.js', owners: ['@simplest-team'] });
    });

    it('prefers character classes over wildcards', () => {
      const codeowners = `
src/[!.]*.js @no-dot-team
src/*.js @all-team
`;
      const result = findBestMatch('src/main.js', codeowners);
      // Character class is more specific than wildcard
      assert.deepStrictEqual(result, { path: 'src/[!.]*.js', owners: ['@no-dot-team'] });
    });
  });

  describe('path depth edge cases', () => {
    it('prefers deeper paths over shallower ones', () => {
      const codeowners = `
*.js @root-team
a/b/c/d/e/f/g/*.js @deep-team
`;
      const result = findBestMatch('a/b/c/d/e/f/g/main.js', codeowners);
      // Deeper path should win
      assert.deepStrictEqual(result, { path: 'a/b/c/d/e/f/g/*.js', owners: ['@deep-team'] });
    });

    it('uses pattern specificity when paths have equal depth', () => {
      const codeowners = `
src/utils/*.js @wildcard-team
src/utils/[a-z]*.js @charclass-team
`;
      const result = findBestMatch('src/utils/helper.js', codeowners);
      // Character class is more specific than wildcard
      assert.deepStrictEqual(result, { path: 'src/utils/[a-z]*.js', owners: ['@charclass-team'] });
    });
  });
});

describe('security and performance', () => {
  describe('malicious patterns', () => {
    it('processes excessive recursive wildcards safely', () => {
      const maliciousPattern = '**/a/**/b/**/c/**/d/**/e/**/f/**/g/**/h/**/i/**/j/**/k/**/l/**/m/**/n/**/o/**/p/**/q/**/r/**/s/**/t/**/u/**/v/**/w/**/x/**/y/**/z';
      
      // Should either reject or process safely
      assert.doesNotThrow(() => {
        const result = pathMatches('src/main.js', maliciousPattern);
        // Result should be deterministic and safe
      });
    });

    it('prevents regex injection attacks', () => {
      const maliciousPattern = 'src/main.js[';
      assert.doesNotThrow(() => pathMatches('src/main.js', maliciousPattern));
      
      const maliciousPattern2 = 'src/main.js(';
      assert.doesNotThrow(() => pathMatches('src/main.js', maliciousPattern2));
    });
  });

  describe('performance guarantees', () => {
    it('completes complex patterns within reasonable time', () => {
      const complexPattern = 'src/**/components/**/*.{js,ts,jsx,tsx}';
      const startTime = Date.now();
      
      pathMatches('src/pages/home/components/Button.jsx', complexPattern);
      
      const endTime = Date.now();
      assert(endTime - startTime < 100); // Should complete in <100ms
    });
  });
});

describe('cross-platform compatibility', () => {
  describe('path separators', () => {
    it('normalizes Windows path separators to Unix style', () => {
      assert.strictEqual(pathMatches('src\\main.js', 'src/*.js'), true);
      assert.strictEqual(pathMatches('src\\utils\\helper.js', 'src/**/*.js'), true);
    });

    it('processes mixed path separators consistently', () => {
      assert.strictEqual(pathMatches('src/utils\\helper.js', 'src/**/*.js'), true);
      assert.strictEqual(pathMatches('src\\utils/helper.js', 'src/**/*.js'), true);
    });
  });

  describe('case sensitivity', () => {
    it('respects case sensitivity in pattern matching', () => {
      assert.strictEqual(pathMatches('src/Main.js', 'src/main.js'), false);
      assert.strictEqual(pathMatches('SRC/main.js', 'src/main.js'), false);
      assert.strictEqual(pathMatches('src/main.js', 'src/main.js'), true);
    });
  });
});

describe('real-world CODEOWNERS examples', () => {
  it('processes GitHub-style patterns correctly', () => {
    const githubCodeowners = `
# Global owners
*       @global-owner1 @global-owner2

# File type owners
*.js    @js-owner
*.go    @go-owner
*.txt   @docs-owner
*.py    @python-owner

# Directory owners
docs/*  docs@example.com
src/     @src-team

# Complex patterns
src/**/*.js @js-team
src/**/*.ts @ts-team
src/**/*.{js,ts} @js-ts-team
src/components/**/*.{jsx,tsx} @react-team
src/pages/**/*.{js,ts} @pages-team

# Specific files
src/main.js @core-team
src/config.json @config-team
`;

    const result = findBestMatch('src/utils/helper.js', githubCodeowners);
    assert.deepStrictEqual(result, { path: 'src/**/*.js', owners: ['@js-team'] });
  });
});
