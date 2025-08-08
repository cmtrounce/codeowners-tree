"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parseCodeownersLine_1 = require("../src/helpers/parseCodeownersLine");
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
        test('should parse simple path without spaces', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('src/main.js @team1 @team2');
            expect(result).toEqual({
                path: 'src/main.js',
                owners: ['@team1', '@team2']
            });
        });
        test('should parse quoted path with spaces', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('"src/my folder/file.txt" @team1 @team2');
            expect(result).toEqual({
                path: 'src/my folder/file.txt',
                owners: ['@team1', '@team2']
            });
        });
        test('should handle single owner', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('src/main.js @team1');
            expect(result).toEqual({
                path: 'src/main.js',
                owners: ['@team1']
            });
        });
        test('should handle multiple spaces between owners', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('src/main.js @team1    @team2');
            expect(result).toEqual({
                path: 'src/main.js',
                owners: ['@team1', '@team2']
            });
        });
    });
    describe('Comments handling', () => {
        test('should ignore comments after #', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('src/main.js @team1 @team2 # This is a comment');
            expect(result).toEqual({
                path: 'src/main.js',
                owners: ['@team1', '@team2']
            });
        });
        test('should handle quoted path with comment', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('"src/my folder/file.txt" @team1 @team2 # Comment');
            expect(result).toEqual({
                path: 'src/my folder/file.txt',
                owners: ['@team1', '@team2']
            });
        });
        test('should handle comment without space', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('src/main.js @team1 @team2#comment');
            expect(result).toEqual({
                path: 'src/main.js',
                owners: ['@team1', '@team2']
            });
        });
        test('should return null for comment-only lines', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('# This is just a comment');
            expect(result).toBeNull();
        });
        test('should return null for empty lines', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('');
            expect(result).toBeNull();
        });
        test('should return null for whitespace-only lines', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('   ');
            expect(result).toBeNull();
        });
    });
    describe('Edge cases', () => {
        test('should handle path with # in it', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('src/main#.js @team1 @team2');
            expect(result).toEqual({
                path: 'src/main#.js',
                owners: ['@team1', '@team2']
            });
        });
        test('should handle quoted path with # in it', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('"src/main#.js" @team1 @team2');
            expect(result).toEqual({
                path: 'src/main#.js',
                owners: ['@team1', '@team2']
            });
        });
        test('should handle path with @ symbol', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('src/@main.js @team1 @team2');
            expect(result).toEqual({
                path: 'src/@main.js',
                owners: ['@team1', '@team2']
            });
        });
        test('should handle complex quoted path', () => {
            const result = (0, parseCodeownersLine_1.parseCodeownersLine)('"src/my complex folder with spaces/file name.txt" @team1 @team2');
            expect(result).toEqual({
                path: 'src/my complex folder with spaces/file name.txt',
                owners: ['@team1', '@team2']
            });
        });
    });
    describe('Comparison with old parsing logic', () => {
        test('should maintain backward compatibility for simple paths', () => {
            const line = 'src/main.js @team1 @team2';
            const newResult = (0, parseCodeownersLine_1.parseCodeownersLine)(line);
            const oldResult = oldParseCodeownersLine(line);
            expect(newResult).toEqual(oldResult);
        });
        test('should fix parsing for quoted paths with spaces', () => {
            const line = '"src/my folder/file.txt" @team1 @team2';
            const newResult = (0, parseCodeownersLine_1.parseCodeownersLine)(line);
            const oldResult = oldParseCodeownersLine(line);
            // Old logic would break this
            expect(oldResult).toEqual({
                path: '"src/my',
                owners: ['folder/file.txt"', '@team1', '@team2']
            });
            // New logic should fix it
            expect(newResult).toEqual({
                path: 'src/my folder/file.txt',
                owners: ['@team1', '@team2']
            });
        });
        test('should fix parsing for unquoted paths with spaces', () => {
            const line = 'src/my folder/file.txt @team1 @team2';
            const newResult = (0, parseCodeownersLine_1.parseCodeownersLine)(line);
            const oldResult = oldParseCodeownersLine(line);
            // Both should handle this the same way (first space splits path and owners)
            expect(newResult).toEqual(oldResult);
        });
        test('should handle comments the same way', () => {
            const line = 'src/main.js @team1 @team2 # comment';
            const newResult = (0, parseCodeownersLine_1.parseCodeownersLine)(line);
            const oldResult = oldParseCodeownersLine(line);
            expect(newResult).toEqual(oldResult);
        });
    });
    describe('Real-world examples', () => {
        test('should handle typical CODEOWNERS patterns', () => {
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
            examples.forEach(({ line, expected }) => {
                const result = (0, parseCodeownersLine_1.parseCodeownersLine)(line);
                expect(result).toEqual(expected);
            });
        });
    });
});
//# sourceMappingURL=parseCodeownersLine.test.js.map