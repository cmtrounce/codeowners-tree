"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const getCodeownersTeams_1 = require("../src/helpers/getCodeownersTeams");
// Mock fs module
jest.mock('fs');
describe('getCodeownersTeams', () => {
    const mockFs = fs;
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('should extract teams from simple CODEOWNERS content', () => {
        const mockContent = `
src/main.js @team1 @team2
src/components/ @ui-team @frontend-team
*.js @javascript-team
    `;
        mockFs.readFileSync.mockReturnValue(mockContent);
        const result = (0, getCodeownersTeams_1.getCodeownersTeams)('/fake/path/CODEOWNERS');
        expect(result).toEqual(new Set([
            '@team1',
            '@team2',
            '@ui-team',
            '@frontend-team',
            '@javascript-team'
        ]));
    });
    test('should handle quoted paths with spaces', () => {
        const mockContent = `
"src/my folder/file.txt" @team1 @team2
"src/components/my component/" @ui-team
    `;
        mockFs.readFileSync.mockReturnValue(mockContent);
        const result = (0, getCodeownersTeams_1.getCodeownersTeams)('/fake/path/CODEOWNERS');
        expect(result).toEqual(new Set([
            '@team1',
            '@team2',
            '@ui-team'
        ]));
    });
    test('should ignore comments and empty lines', () => {
        const mockContent = `
# This is a comment
src/main.js @team1 @team2

# Another comment
src/components/ @ui-team

    `;
        mockFs.readFileSync.mockReturnValue(mockContent);
        const result = (0, getCodeownersTeams_1.getCodeownersTeams)('/fake/path/CODEOWNERS');
        expect(result).toEqual(new Set([
            '@team1',
            '@team2',
            '@ui-team'
        ]));
    });
    test('should handle mixed quoted and unquoted paths', () => {
        const mockContent = `
src/main.js @team1
"src/my folder/file.txt" @team2
src/components/ @team3
"src/another folder/" @team4
    `;
        mockFs.readFileSync.mockReturnValue(mockContent);
        const result = (0, getCodeownersTeams_1.getCodeownersTeams)('/fake/path/CODEOWNERS');
        expect(result).toEqual(new Set([
            '@team1',
            '@team2',
            '@team3',
            '@team4'
        ]));
    });
    test('should handle lines with comments', () => {
        const mockContent = `
src/main.js @team1 @team2 # This is a comment
"src/my folder/file.txt" @team3 @team4 # Another comment
    `;
        mockFs.readFileSync.mockReturnValue(mockContent);
        const result = (0, getCodeownersTeams_1.getCodeownersTeams)('/fake/path/CODEOWNERS');
        expect(result).toEqual(new Set([
            '@team1',
            '@team2',
            '@team3',
            '@team4'
        ]));
    });
    test('should handle empty file', () => {
        mockFs.readFileSync.mockReturnValue('');
        const result = (0, getCodeownersTeams_1.getCodeownersTeams)('/fake/path/CODEOWNERS');
        expect(result).toEqual(new Set());
    });
    test('should handle file with only comments', () => {
        const mockContent = `
# This is a comment
# Another comment
    `;
        mockFs.readFileSync.mockReturnValue(mockContent);
        const result = (0, getCodeownersTeams_1.getCodeownersTeams)('/fake/path/CODEOWNERS');
        expect(result).toEqual(new Set());
    });
    test('should call readFileSync with correct parameters', () => {
        mockFs.readFileSync.mockReturnValue('src/main.js @team1');
        (0, getCodeownersTeams_1.getCodeownersTeams)('/fake/path/CODEOWNERS');
        expect(mockFs.readFileSync).toHaveBeenCalledWith('/fake/path/CODEOWNERS', 'utf-8');
    });
});
//# sourceMappingURL=getCodeownersTeams.test.js.map