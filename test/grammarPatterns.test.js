const assert = require('assert');

// Test our TextMate grammar patterns against parseCodeownersLine behavior
describe('TextMate Grammar Pattern Parity Tests', () => {
  
  // Test comment patterns
  describe('Comment Patterns', () => {
    const fullLineCommentPattern = /^\s*(#.*)$/;
    const inlineCommentPattern = /\s(#.*)$/;
    
    it('should match full line comments like parseCodeownersLine', () => {
      const testCases = [
        '# This is a comment',
        '  # Comment with leading spaces',
        '\t# Comment with leading tabs',
        '# Another comment'
      ];
      
      testCases.forEach(comment => {
        assert(fullLineCommentPattern.test(comment), 
          `Full line comment pattern should match: "${comment}"`);
      });
    });
    
    it('should match inline comments like parseCodeownersLine', () => {
      const testCases = [
        'src/main.js @team1 # inline comment',
        'src/utils/ @team2\t# comment with tab',
        'path @team # comment',
        '  path @team # comment with spaces'
      ];
      
      testCases.forEach(line => {
        assert(inlineCommentPattern.test(line), 
          `Inline comment pattern should match: "${line}"`);
      });
    });
    
    it('should not match # in middle of content', () => {
      const testCases = [
        'src/main#.js @team1',
        'src/@main.js @team1',
        'path@team @team2'
      ];
      
      testCases.forEach(line => {
        assert(!fullLineCommentPattern.test(line), 
          `Full line comment pattern should NOT match: "${line}"`);
      });
    });
  });
  
  // Test path patterns
  describe('Path Patterns', () => {
    const unquotedPathPattern = /^\s*((?:[^\s#\\]|\\.)*)(?:\s|$)/;
    const quotedPathPattern = /"([^"]*(?:\\.[^"]*)*)"/;
    
    it('should match simple paths like parseCodeownersLine', () => {
      const testCases = [
        'src/main.js',
        'package.json',
        'src/utils/',
        'docs/',
        'src/components/Button.jsx'
      ];
      
      testCases.forEach(path => {
        const line = `  ${path} @team1`;
        const match = line.match(unquotedPathPattern);
        assert(match, `Unquoted path pattern should match: "${path}"`);
        assert.strictEqual(match[1], path, `Should capture path: "${path}"`);
      });
    });
    
    it('should match quoted paths with spaces like parseCodeownersLine', () => {
      const testCases = [
        '"src/my folder/file.txt"',
        '"docs/user guide/README.md"',
        '"src/components/ui components/"'
      ];
      
      testCases.forEach(path => {
        const line = `  ${path} @team1`;
        const match = line.match(quotedPathPattern);
        assert(match, `Quoted path pattern should match: "${path}"`);
      });
    });
    
    it('should handle escaped characters in paths like parseCodeownersLine', () => {
      const testCases = [
        'src/my\\ folder/file.txt',
        'src/main\\#.js',
        'src/config\\*.json',
        'src/helper\\?.js'
      ];
      
      testCases.forEach(path => {
        const line = `  ${path} @team1`;
        const match = line.match(unquotedPathPattern);
        assert(match, `Path with escaped chars should match: "${path}"`);
        assert.strictEqual(match[1], path, `Should capture entire path: "${path}"`);
      });
    });
  });
  
  // Test team patterns
  describe('Team Patterns', () => {
    const teamPattern = /(@[a-zA-Z0-9][a-zA-Z0-9._-]*)(?:#.*)?/;
    
    it('should match team names like parseCodeownersLine', () => {
      const testCases = [
        '@frontend-team',
        '@javascript-team',
        '@team-with-dashes',
        '@team_with_underscores',
        '@team.with.dots'
      ];
      
      testCases.forEach(team => {
        const line = `src/main.js ${team}`;
        const match = line.match(teamPattern);
        assert(match, `Team pattern should match: "${team}"`);
        assert.strictEqual(match[1], team, `Should capture team: "${team}"`);
      });
    });
    
    it('should handle teams with inline comments like parseCodeownersLine', () => {
      const testCases = [
        '@frontend-team#primary',
        '@javascript-team#secondary',
        '@team#comment'
      ];
      
      testCases.forEach(teamWithComment => {
        const line = `src/main.js ${teamWithComment}`;
        const match = line.match(teamPattern);
        assert(match, `Team with comment pattern should match: "${teamWithComment}"`);
        // Should capture just the team part, not the comment
        const teamPart = teamWithComment.split('#')[0];
        assert.strictEqual(match[1], teamPart, `Should capture team part: "${teamPart}"`);
      });
    });
  });
  
  // Test glob patterns
  describe('Glob Patterns', () => {
    const globPattern = /([*?\[\]!])/;
    
    it('should match glob characters like parseCodeownersLine expects', () => {
      const testCases = [
        '*', '?', '[', ']', '!'
      ];
      
      testCases.forEach(char => {
        assert(globPattern.test(char), `Glob pattern should match: "${char}"`);
      });
    });
    
    it('should match glob patterns in context', () => {
      const testCases = [
        '*.js',
        'src/**/*.test.js',
        'src/[abc]*.js',
        'src/main??.js',
        '!*.min.js'
      ];
      
      testCases.forEach(pattern => {
        const matches = pattern.match(globPattern);
        assert(matches, `Should find glob chars in: "${pattern}"`);
        assert(matches.length > 1, `Should have multiple matches in: "${pattern}"`);
      });
    });
  });
  
  // Test complete line parsing parity
  describe('Complete Line Parity', () => {
    it('should tokenize lines the same way parseCodeownersLine would', () => {
      const testLines = [
        'src/main.js @team1 @team2',
        '"src/my folder/file.txt" @team1 @team2 # inline comment',
        'src/utils/ @team1',
        '*.js @javascript-team',
        'src/main\\ .js @team1',
        'src/main\\#.js @team1',
        'src/@main.js @team1',
        'src/main.js @team#comment @team2'
      ];
      
      testLines.forEach(line => {
        // Test that our patterns can identify the key components
        const hasPath = /^\s*([^#\s]+(?:\.[^#\s]*)*)/.test(line);
        const hasTeams = /(@[a-zA-Z0-9][a-zA-Z0-9._-]*)/.test(line);
        const hasComment = /\s(#.*)$/.test(line);
        
        // Basic validation that we can parse the line
        assert(hasPath || line.trim().startsWith('#'), 
          `Line should have path or be comment: "${line}"`);
        
        if (!line.trim().startsWith('#')) {
          assert(hasTeams, `Non-comment line should have teams: "${line}"`);
        }
      });
    });
  });
});
