"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require('assert');
const { addCodeownersNodes } = require("../out/graph/addCodeownersNodes");
const TreeNode = require("../out/graph/TreeNode").default;

describe('addCodeownersNodes', () => {
    let root;
    
    beforeEach(() => {
        root = new TreeNode('root', false, true);
    });
    
    it('should add nodes for simple path', () => {
        addCodeownersNodes('src/main.js @team1 @team2', '@team1', root);
        assert.ok(root.children['/src']);
        assert.ok(root.children['/src'].children['/src/main.js']);
        assert.strictEqual(root.children['/src'].children['/src/main.js'].isCodeownersLeaf, true);
    });
    
    it('should add nodes for quoted path with spaces', () => {
        addCodeownersNodes('"src/my folder/file.txt" @team1 @team2', '@team1', root);
        assert.ok(root.children['/src']);
        assert.ok(root.children['/src'].children['/src/my folder']);
        assert.ok(root.children['/src'].children['/src/my folder'].children['/src/my folder/file.txt']);
        assert.strictEqual(root.children['/src'].children['/src/my folder'].children['/src/my folder/file.txt'].isCodeownersLeaf, true);
    });
    
    it('should not add nodes if team is not in owners', () => {
        addCodeownersNodes('src/main.js @team1 @team2', '@team3', root);
        assert.strictEqual(Object.keys(root.children).length, 0);
    });
    
    it('should handle nested paths', () => {
        addCodeownersNodes('src/components/Button.js @team1', '@team1', root);
        assert.ok(root.children['/src']);
        assert.ok(root.children['/src'].children['/src/components']);
        assert.ok(root.children['/src'].children['/src/components'].children['/src/components/Button.js']);
        assert.strictEqual(root.children['/src'].children['/src/components'].children['/src/components/Button.js'].isCodeownersLeaf, true);
    });
    
    it('should handle paths with comments', () => {
        addCodeownersNodes('src/main.js @team1 @team2 # This is a comment', '@team1', root);
        assert.ok(root.children['/src']);
        assert.ok(root.children['/src'].children['/src/main.js']);
        assert.strictEqual(root.children['/src'].children['/src/main.js'].isCodeownersLeaf, true);
    });
    
    it('should handle quoted paths with comments', () => {
        addCodeownersNodes('"src/my folder/file.txt" @team1 @team2 # Comment', '@team1', root);
        assert.ok(root.children['/src']);
        assert.ok(root.children['/src'].children['/src/my folder']);
        assert.ok(root.children['/src'].children['/src/my folder'].children['/src/my folder/file.txt']);
        assert.strictEqual(root.children['/src'].children['/src/my folder'].children['/src/my folder/file.txt'].isCodeownersLeaf, true);
    });
    
    it('should handle empty lines', () => {
        addCodeownersNodes('', '@team1', root);
        assert.strictEqual(Object.keys(root.children).length, 0);
    });
    
    it('should handle comment-only lines', () => {
        addCodeownersNodes('# This is a comment', '@team1', root);
        assert.strictEqual(Object.keys(root.children).length, 0);
    });
    
    it('should handle multiple lines for same team', () => {
        addCodeownersNodes('src/main.js @team1', '@team1', root);
        addCodeownersNodes('src/utils.js @team1', '@team1', root);
        assert.ok(root.children['/src']);
        assert.ok(root.children['/src'].children['/src/main.js']);
        assert.ok(root.children['/src'].children['/src/utils.js']);
        assert.strictEqual(root.children['/src'].children['/src/main.js'].isCodeownersLeaf, true);
        assert.strictEqual(root.children['/src'].children['/src/utils.js'].isCodeownersLeaf, true);
    });
    
    it('should handle complex quoted paths', () => {
        addCodeownersNodes('"src/my complex folder with spaces/file name.txt" @team1', '@team1', root);
        const expectedPath = '/src/my complex folder with spaces/file name.txt';
        const pathParts = expectedPath.split('/');
        let currentNode = root;
        let currentPath = '';
        for (let i = 1; i < pathParts.length; i++) {
            currentPath += '/' + pathParts[i];
            assert.ok(currentNode.children[currentPath]);
            currentNode = currentNode.children[currentPath];
        }
        assert.strictEqual(currentNode.isCodeownersLeaf, true);
    });
    
    it('should handle paths with @ symbols', () => {
        addCodeownersNodes('src/@main.js @team1', '@team1', root);
        assert.ok(root.children['/src']);
        assert.ok(root.children['/src'].children['/src/@main.js']);
        assert.strictEqual(root.children['/src'].children['/src/@main.js'].isCodeownersLeaf, true);
    });
    
    it('should handle paths with # symbols', () => {
        addCodeownersNodes('src/main#.js @team1', '@team1', root);
        assert.ok(root.children['/src']);
        assert.ok(root.children['/src'].children['/src/main#.js']);
        assert.strictEqual(root.children['/src'].children['/src/main#.js'].isCodeownersLeaf, true);
    });
});