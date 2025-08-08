"use strict";
const assert = require('assert');
const fs = require("fs");
const { getCodeownersTeams } = require("../out/helpers/getCodeownersTeams");

// Mock fs module
const originalReadFileSync = fs.readFileSync;
let mockReadFileSync;

describe('getCodeownersTeams', () => {
    beforeEach(() => {
        // Create a mock for readFileSync
        mockReadFileSync = (content) => {
            fs.readFileSync = () => content;
        };
    });

    afterEach(() => {
        // Restore original function
        fs.readFileSync = originalReadFileSync;
    });

    it('should extract teams from simple CODEOWNERS content', () => {
        const mockContent = `
src/main.js @team1 @team2
src/components/ @ui-team @frontend-team
*.js @javascript-team
    `;
        mockReadFileSync(mockContent);
        const result = getCodeownersTeams('/fake/path/CODEOWNERS');
        assert.deepStrictEqual(result, new Set([
            '@team1',
            '@team2',
            '@ui-team',
            '@frontend-team',
            '@javascript-team'
        ]));
    });

    it('should handle quoted paths with spaces', () => {
        const mockContent = `
"src/my folder/file.txt" @team1 @team2
"src/components/my component/" @ui-team
    `;
        mockReadFileSync(mockContent);
        const result = getCodeownersTeams('/fake/path/CODEOWNERS');
        assert.deepStrictEqual(result, new Set([
            '@team1',
            '@team2',
            '@ui-team'
        ]));
    });

    it('should ignore comments and empty lines', () => {
        const mockContent = `
# This is a comment
src/main.js @team1 @team2

# Another comment
src/components/ @ui-team

    `;
        mockReadFileSync(mockContent);
        const result = getCodeownersTeams('/fake/path/CODEOWNERS');
        assert.deepStrictEqual(result, new Set([
            '@team1',
            '@team2',
            '@ui-team'
        ]));
    });

    it('should handle mixed quoted and unquoted paths', () => {
        const mockContent = `
src/main.js @team1
"src/my folder/file.txt" @team2
src/components/ @team3
"src/another folder/" @team4
    `;
        mockReadFileSync(mockContent);
        const result = getCodeownersTeams('/fake/path/CODEOWNERS');
        assert.deepStrictEqual(result, new Set([
            '@team1',
            '@team2',
            '@team3',
            '@team4'
        ]));
    });

    it('should handle lines with comments', () => {
        const mockContent = `
src/main.js @team1 @team2 # This is a comment
"src/my folder/file.txt" @team3 @team4 # Another comment
    `;
        mockReadFileSync(mockContent);
        const result = getCodeownersTeams('/fake/path/CODEOWNERS');
        assert.deepStrictEqual(result, new Set([
            '@team1',
            '@team2',
            '@team3',
            '@team4'
        ]));
    });

    it('should handle empty file', () => {
        mockReadFileSync('');
        const result = getCodeownersTeams('/fake/path/CODEOWNERS');
        assert.deepStrictEqual(result, new Set());
    });

    it('should handle file with only comments', () => {
        const mockContent = `
# This is a comment
# Another comment
    `;
        mockReadFileSync(mockContent);
        const result = getCodeownersTeams('/fake/path/CODEOWNERS');
        assert.deepStrictEqual(result, new Set());
    });

    it('should call readFileSync with correct parameters', () => {
        let calledPath = '';
        let calledEncoding = '';
        
        // Override readFileSync to capture parameters
        fs.readFileSync = (path, encoding) => {
            calledPath = path;
            calledEncoding = encoding;
            return 'src/main.js @team1';
        };
        
        getCodeownersTeams('/fake/path/CODEOWNERS');
        assert.strictEqual(calledPath, '/fake/path/CODEOWNERS');
        assert.strictEqual(calledEncoding, 'utf-8');
    });
});