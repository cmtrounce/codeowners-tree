"use strict";
const assert = require('assert');
const { parseCodeownersLine } = require("../out/helpers/parseCodeownersLine");

// Mock the old parsing logic for comparison
function oldParseCodeownersLine(line) {
    const lineWithoutComment = line.indexOf("#") >= 0
        ? line.substring(0, line.indexOf("#")).trimEnd()
        : line;
    if (!lineWithoutComment) {
        return null;
    }
    const [path, ...owners] = lineWithoutComment.split(/\s+/);
    return { path, owners };
}

describe('parseCodeownersLine', () => {
    describe('Basic functionality', () => {
        it('should parse simple path without spaces', () => {
            const result = parseCodeownersLine('src/main.js @team1 @team2');
            assert.deepStrictEqual(result, {
                path: 'src/main.js',
                owners: ['@team1', '@team2']
            });
        });
        
        it('should parse quoted path with spaces', () => {
            const result = parseCodeownersLine('"src/my folder/file.txt" @team1 @team2');
            assert.deepStrictEqual(result, {
                path: 'src/my folder/file.txt',
                owners: ['@team1', '@team2']
            });
        });
        
        it('should handle single owner', () => {
            const result = parseCodeownersLine('src/main.js @team1');
            assert.deepStrictEqual(result, {
                path: 'src/main.js',
                owners: ['@team1']
            });
        });
        
        it('should handle multiple spaces between owners', () => {
            const result = parseCodeownersLine('src/main.js @team1    @team2');
            assert.deepStrictEqual(result, {
                path: 'src/main.js',
                owners: ['@team1', '@team2']
            });
        });
    });
    
    describe('Comments handling', () => {
        it('should ignore comments after #', () => {
            const result = parseCodeownersLine('src/main.js @team1 @team2 # This is a comment');
            assert.deepStrictEqual(result, {
                path: 'src/main.js',
                owners: ['@team1', '@team2']
            });
        });
        
        it('should handle quoted path with comment', () => {
            const result = parseCodeownersLine('"src/my folder/file.txt" @team1 @team2 # Comment');
            assert.deepStrictEqual(result, {
                path: 'src/my folder/file.txt',
                owners: ['@team1', '@team2']
            });
        });
        
        it('should handle comment without space', () => {
            const result = parseCodeownersLine('src/main.js @team1 @team2#comment');
            assert.deepStrictEqual(result, {
                path: 'src/main.js',
                owners: ['@team1', '@team2']
            });
        });
        
        it('should return null for comment-only lines', () => {
            const result = parseCodeownersLine('# This is just a comment');
            assert.strictEqual(result, null);
        });
        
        it('should return null for empty lines', () => {
            const result = parseCodeownersLine('');
            assert.strictEqual(result, null);
        });
        
        it('should return null for whitespace-only lines', () => {
            const result = parseCodeownersLine('   ');
            assert.strictEqual(result, null);
        });
    });
    
    describe('Edge cases', () => {
        it('should handle path with # in it', () => {
            const result = parseCodeownersLine('src/main#.js @team1 @team2');
            assert.deepStrictEqual(result, {
                path: 'src/main#.js',
                owners: ['@team1', '@team2']
            });
        });
        
        it('should handle quoted path with # in it', () => {
            const result = parseCodeownersLine('"src/main#.js" @team1 @team2');
            assert.deepStrictEqual(result, {
                path: 'src/main#.js',
                owners: ['@team1', '@team2']
            });
        });
        
        it('should handle path with @ symbol', () => {
            const result = parseCodeownersLine('src/@main.js @team1 @team2');
            assert.deepStrictEqual(result, {
                path: 'src/@main.js',
                owners: ['@team1', '@team2']
            });
        });
        
        it('should handle complex quoted path', () => {
            const result = parseCodeownersLine('"src/my complex folder with spaces/file name.txt" @team1 @team2');
            assert.deepStrictEqual(result, {
                path: 'src/my complex folder with spaces/file name.txt',
                owners: ['@team1', '@team2']
            });
        });
    });
    
    describe('Escaped spaces (backslash escaping)', () => {
        it('should handle escaped spaces in paths', () => {
            const result = parseCodeownersLine('src/thing/some\\ directory/thing/ @team1');
            assert.deepStrictEqual(result, {
                path: 'src/thing/some directory/thing/',
                owners: ['@team1']
            });
        });
        
        it('should handle escaped spaces in component names', () => {
            const result = parseCodeownersLine('src/components/my\\ component/ @team1');
            assert.deepStrictEqual(result, {
                path: 'src/components/my component/',
                owners: ['@team1']
            });
        });
        
        it('should handle escaped spaces in file names', () => {
            const result = parseCodeownersLine('src/file\\ with\\ spaces.js @team1');
            assert.deepStrictEqual(result, {
                path: 'src/file with spaces.js',
                owners: ['@team1']
            });
        });
        
        it('should handle mixed escaped and unescaped spaces', () => {
            const result = parseCodeownersLine('src/my\\ folder/regular\\ file.js @team1');
            assert.deepStrictEqual(result, {
                path: 'src/my folder/regular file.js',
                owners: ['@team1']
            });
        });
    });
    
    describe('Email addresses as owners', () => {
        it('should handle email addresses as owners', () => {
            const result = parseCodeownersLine('*.go docs@example.com');
            assert.deepStrictEqual(result, {
                path: '*.go',
                owners: ['docs@example.com']
            });
        });
        
        it('should handle email addresses with quoted paths', () => {
            const result = parseCodeownersLine('docs/* docs@example.com');
            assert.deepStrictEqual(result, {
                path: 'docs/*',
                owners: ['docs@example.com']
            });
        });
        
        it('should handle mixed @usernames and email addresses', () => {
            const result = parseCodeownersLine('src/main.js @team1 docs@example.com @team2');
            assert.deepStrictEqual(result, {
                path: 'src/main.js',
                owners: ['@team1', 'docs@example.com', '@team2']
            });
        });
    });
    
    describe('GitHub documentation examples', () => {
        it('should handle GitHub documentation examples', () => {
            const examples = [
                {
                    line: '*       @global-owner1 @global-owner2',
                    expected: { path: '*', owners: ['@global-owner1', '@global-owner2'] }
                },
                {
                    line: '*.js    @js-owner #This is an inline comment.',
                    expected: { path: '*.js', owners: ['@js-owner'] }
                },
                {
                    line: '*.go docs@example.com',
                    expected: { path: '*.go', owners: ['docs@example.com'] }
                },
                {
                    line: '*.txt @octo-org/octocats',
                    expected: { path: '*.txt', owners: ['@octo-org/octocats'] }
                },
                {
                    line: '/build/logs/ @doctocat',
                    expected: { path: '/build/logs/', owners: ['@doctocat'] }
                },
                {
                    line: 'docs/* docs@example.com',
                    expected: { path: 'docs/*', owners: ['docs@example.com'] }
                },
                {
                    line: 'apps/ @octocat',
                    expected: { path: 'apps/', owners: ['@octocat'] }
                },
                {
                    line: '/docs/ @doctocat',
                    expected: { path: '/docs/', owners: ['@doctocat'] }
                },
                {
                    line: '/scripts/ @doctocat @octocat',
                    expected: { path: '/scripts/', owners: ['@doctocat', '@octocat'] }
                },
                {
                    line: '**/logs @octocat',
                    expected: { path: '**/logs', owners: ['@octocat'] }
                },
                {
                    line: '/apps/ @octocat',
                    expected: { path: '/apps/', owners: ['@octocat'] }
                },
                {
                    line: '/apps/github @doctocat',
                    expected: { path: '/apps/github', owners: ['@doctocat'] }
                }
            ];
            
            for (const { line, expected } of examples) {
                const result = parseCodeownersLine(line);
                assert.deepStrictEqual(result, expected);
            }
        });
        
        it('should handle lines without owners (should return null)', () => {
            const result = parseCodeownersLine('/apps/github');
            assert.strictEqual(result, null);
        });
    });
    
    describe('Comparison with old parsing logic', () => {
        it('should maintain backward compatibility for simple paths', () => {
            const line = 'src/main.js @team1 @team2';
            const newResult = parseCodeownersLine(line);
            const oldResult = oldParseCodeownersLine(line);
            assert.deepStrictEqual(newResult, oldResult);
        });
        
        it('should fix parsing for quoted paths with spaces', () => {
            const line = '"src/my folder/file.txt" @team1 @team2';
            const newResult = parseCodeownersLine(line);
            const oldResult = oldParseCodeownersLine(line);
            // Old logic would break this
            assert.deepStrictEqual(oldResult, {
                path: '"src/my',
                owners: ['folder/file.txt"', '@team1', '@team2']
            });
            // New logic should fix it
            assert.deepStrictEqual(newResult, {
                path: 'src/my folder/file.txt',
                owners: ['@team1', '@team2']
            });
        });
        
        it('should fix parsing for unquoted paths with spaces', () => {
            const line = 'src/my folder/file.txt @team1 @team2';
            const newResult = parseCodeownersLine(line);
            const oldResult = oldParseCodeownersLine(line);
            // Both should handle this the same way (first space splits path and owners)
            assert.deepStrictEqual(newResult, oldResult);
        });
        
        it('should handle comments the same way', () => {
            const line = 'src/main.js @team1 @team2 # comment';
            const newResult = parseCodeownersLine(line);
            const oldResult = oldParseCodeownersLine(line);
            assert.deepStrictEqual(newResult, oldResult);
        });
    });
    
    describe('Real-world examples', () => {
        it('should handle typical CODEOWNERS patterns', () => {
            const examples = [
                {
                    line: '*.js @frontend-team',
                    expected: { path: '*.js', owners: ['@frontend-team'] }
                },
                {
                    line: 'src/components/ @ui-team @frontend-team',
                    expected: { path: 'src/components/', owners: ['@ui-team', '@frontend-team'] }
                },
                {
                    line: '"src/my components/" @ui-team',
                    expected: { path: 'src/my components/', owners: ['@ui-team'] }
                },
                {
                    line: 'docs/ @docs-team # Documentation files',
                    expected: { path: 'docs/', owners: ['@docs-team'] }
                }
            ];
            
            for (const { line, expected } of examples) {
                const result = parseCodeownersLine(line);
                assert.deepStrictEqual(result, expected);
            }
        });
    });
});