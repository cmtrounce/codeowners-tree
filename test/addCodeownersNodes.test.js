"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const addCodeownersNodes_1 = require("../src/graph/addCodeownersNodes");
const TreeNode_1 = require("../src/graph/TreeNode");
describe('addCodeownersNodes', () => {
    let root;
    beforeEach(() => {
        root = new TreeNode_1.default('root', false, true);
    });
    test('should add nodes for simple path', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('src/main.js @team1 @team2', '@team1', root);
        expect(root.children['/src']).toBeDefined();
        expect(root.children['/src'].children['/src/main.js']).toBeDefined();
        expect(root.children['/src'].children['/src/main.js'].isCodeownersLeaf).toBe(true);
    });
    test('should add nodes for quoted path with spaces', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('"src/my folder/file.txt" @team1 @team2', '@team1', root);
        expect(root.children['/src']).toBeDefined();
        expect(root.children['/src'].children['/src/my folder']).toBeDefined();
        expect(root.children['/src'].children['/src/my folder'].children['/src/my folder/file.txt']).toBeDefined();
        expect(root.children['/src'].children['/src/my folder'].children['/src/my folder/file.txt'].isCodeownersLeaf).toBe(true);
    });
    test('should not add nodes if team is not in owners', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('src/main.js @team1 @team2', '@team3', root);
        expect(Object.keys(root.children)).toHaveLength(0);
    });
    test('should handle nested paths', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('src/components/Button.js @team1', '@team1', root);
        expect(root.children['/src']).toBeDefined();
        expect(root.children['/src'].children['/src/components']).toBeDefined();
        expect(root.children['/src'].children['/src/components'].children['/src/components/Button.js']).toBeDefined();
        expect(root.children['/src'].children['/src/components'].children['/src/components/Button.js'].isCodeownersLeaf).toBe(true);
    });
    test('should handle paths with comments', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('src/main.js @team1 @team2 # This is a comment', '@team1', root);
        expect(root.children['/src']).toBeDefined();
        expect(root.children['/src'].children['/src/main.js']).toBeDefined();
        expect(root.children['/src'].children['/src/main.js'].isCodeownersLeaf).toBe(true);
    });
    test('should handle quoted paths with comments', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('"src/my folder/file.txt" @team1 @team2 # Comment', '@team1', root);
        expect(root.children['/src']).toBeDefined();
        expect(root.children['/src'].children['/src/my folder']).toBeDefined();
        expect(root.children['/src'].children['/src/my folder'].children['/src/my folder/file.txt']).toBeDefined();
        expect(root.children['/src'].children['/src/my folder'].children['/src/my folder/file.txt'].isCodeownersLeaf).toBe(true);
    });
    test('should handle empty lines', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('', '@team1', root);
        expect(Object.keys(root.children)).toHaveLength(0);
    });
    test('should handle comment-only lines', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('# This is a comment', '@team1', root);
        expect(Object.keys(root.children)).toHaveLength(0);
    });
    test('should handle multiple lines for same team', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('src/main.js @team1', '@team1', root);
        (0, addCodeownersNodes_1.addCodeownersNodes)('src/utils.js @team1', '@team1', root);
        expect(root.children['/src']).toBeDefined();
        expect(root.children['/src'].children['/src/main.js']).toBeDefined();
        expect(root.children['/src'].children['/src/utils.js']).toBeDefined();
        expect(root.children['/src'].children['/src/main.js'].isCodeownersLeaf).toBe(true);
        expect(root.children['/src'].children['/src/utils.js'].isCodeownersLeaf).toBe(true);
    });
    test('should handle complex quoted paths', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('"src/my complex folder with spaces/file name.txt" @team1', '@team1', root);
        const expectedPath = '/src/my complex folder with spaces/file name.txt';
        const pathParts = expectedPath.split('/');
        let currentNode = root;
        let currentPath = '';
        for (let i = 1; i < pathParts.length; i++) {
            currentPath += '/' + pathParts[i];
            expect(currentNode.children[currentPath]).toBeDefined();
            currentNode = currentNode.children[currentPath];
        }
        expect(currentNode.isCodeownersLeaf).toBe(true);
    });
    test('should handle paths with @ symbols', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('src/@main.js @team1', '@team1', root);
        expect(root.children['/src']).toBeDefined();
        expect(root.children['/src'].children['/src/@main.js']).toBeDefined();
        expect(root.children['/src'].children['/src/@main.js'].isCodeownersLeaf).toBe(true);
    });
    test('should handle paths with # symbols', () => {
        (0, addCodeownersNodes_1.addCodeownersNodes)('src/main#.js @team1', '@team1', root);
        expect(root.children['/src']).toBeDefined();
        expect(root.children['/src'].children['/src/main#.js']).toBeDefined();
        expect(root.children['/src'].children['/src/main#.js'].isCodeownersLeaf).toBe(true);
    });
});
//# sourceMappingURL=addCodeownersNodes.test.js.map