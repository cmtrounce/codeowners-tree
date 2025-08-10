const assert = require('assert');

// Test the logic directly without vscode dependency
function isGitHubTeam(teamName) {
  const trimmed = teamName.trim();
  if (trimmed.length === 0) {
    return false;
  }
  
  if (trimmed.startsWith('@') && trimmed.includes('/')) {
    return true;
  }
  
  if (trimmed.startsWith('@')) {
    return false;
  }
  
  if (trimmed.includes('@')) {
    return false;
  }
  
  if (trimmed.includes('/')) {
    return true;
  }
  
  return true;
}

function isGitHubUser(teamName) {
  const trimmed = teamName.trim();
  if (trimmed.startsWith('@') && trimmed.includes('/')) {
    return false;
  }
  return trimmed.startsWith('@') && !trimmed.includes('@', 1) && trimmed.length > 1;
}

function getGitHubTeamUrl(teamName, workspaceRoot) {
  if (isGitHubUser(teamName)) {
    const username = teamName.substring(1);
    return `https://github.com/${username}`;
  }
  
  if (!isGitHubTeam(teamName)) {
    return null;
  }

  try {
    const { execSync } = require('child_process');
    const gitRemote = execSync('git remote get-url origin', { 
      cwd: workspaceRoot, 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    
    const match = gitRemote.match(/github\.com[/:]([^/]+)/);
    if (match) {
      const organization = match[1];
      
      if (teamName.includes('/')) {
        let org, team;
        if (teamName.startsWith('@')) {
          const parts = teamName.substring(1).split('/');
          org = parts[0];
          team = parts[1];
        } else {
          const parts = teamName.split('/');
          org = parts[0];
          team = parts[1];
        }
        return `https://github.com/orgs/${org}/teams/${team}`;
      } else {
        return `https://github.com/orgs/${organization}/teams/${teamName}`;
      }
    }
  } catch (error) {
    console.warn('Could not determine GitHub organization from git remote:', error);
  }
  
  return null;
}

describe('GitHub Team Helper', () => {
  describe('isGitHubTeam', () => {
    it('should identify simple team names as teams', () => {
      assert.strictEqual(isGitHubTeam('team-name'), true);
      assert.strictEqual(isGitHubTeam('developers'), true);
      assert.strictEqual(isGitHubTeam('frontend'), true);
    });

    it('should identify org/team format as teams', () => {
      assert.strictEqual(isGitHubTeam('org/team-name'), true);
      assert.strictEqual(isGitHubTeam('company/developers'), true);
      assert.strictEqual(isGitHubTeam('myorg/frontend'), true);
    });

    it('should identify @org/team format as teams', () => {
      assert.strictEqual(isGitHubTeam('@org/team-name'), true);
      assert.strictEqual(isGitHubTeam('@company/developers'), true);
      assert.strictEqual(isGitHubTeam('@myorg/frontend'), true);
    });

    it('should identify individual users as not teams', () => {
      assert.strictEqual(isGitHubTeam('@username'), false);
      assert.strictEqual(isGitHubTeam('@john'), false);
      assert.strictEqual(isGitHubTeam('@developer'), false);
    });

    it('should identify email addresses as not teams', () => {
      assert.strictEqual(isGitHubTeam('user@domain.com'), false);
      assert.strictEqual(isGitHubTeam('john@company.com'), false);
      assert.strictEqual(isGitHubTeam('team@example.org'), false);
    });

    it('should handle edge cases', () => {
      assert.strictEqual(isGitHubTeam(''), false);
      assert.strictEqual(isGitHubTeam('   '), false);
      assert.strictEqual(isGitHubTeam('@'), false);
      assert.strictEqual(isGitHubTeam('/'), true);
    });
  });

  describe('isGitHubUser', () => {
    it('should identify individual users correctly', () => {
      assert.strictEqual(isGitHubUser('@username'), true);
      assert.strictEqual(isGitHubUser('@john'), true);
      assert.strictEqual(isGitHubUser('@developer'), true);
    });

    it('should identify @org/team format as not users', () => {
      assert.strictEqual(isGitHubUser('@org/team-name'), false);
      assert.strictEqual(isGitHubUser('@company/developers'), false);
      assert.strictEqual(isGitHubUser('@myorg/frontend'), false);
    });

    it('should identify simple team names as not users', () => {
      assert.strictEqual(isGitHubUser('team-name'), false);
      assert.strictEqual(isGitHubUser('developers'), false);
      assert.strictEqual(isGitHubUser('frontend'), false);
    });

    it('should identify org/team format as not users', () => {
      assert.strictEqual(isGitHubUser('org/team-name'), false);
      assert.strictEqual(isGitHubUser('company/developers'), false);
      assert.strictEqual(isGitHubUser('myorg/frontend'), false);
    });

    it('should identify email addresses as not users', () => {
      assert.strictEqual(isGitHubUser('user@domain.com'), false);
      assert.strictEqual(isGitHubUser('john@company.com'), false);
      assert.strictEqual(isGitHubUser('team@example.org'), false);
    });

    it('should handle edge cases', () => {
      assert.strictEqual(isGitHubUser(''), false);
      assert.strictEqual(isGitHubUser('   '), false);
      assert.strictEqual(isGitHubUser('@'), false);
      assert.strictEqual(isGitHubUser('username'), false);
      assert.strictEqual(isGitHubUser('@'), false);
    });
  });

  describe('getGitHubTeamUrl', () => {
    const mockWorkspaceRoot = process.cwd();

    it('should generate correct URLs for individual users', () => {
      const url = getGitHubTeamUrl('@username', mockWorkspaceRoot);
      assert.strictEqual(url, 'https://github.com/username');
    });

    it('should generate correct URLs for org/team format', () => {
      const url = getGitHubTeamUrl('org/team-name', mockWorkspaceRoot);
      assert.strictEqual(url, 'https://github.com/orgs/org/teams/team-name');
    });

    it('should generate correct URLs for @org/team format', () => {
      const url = getGitHubTeamUrl('@org/team-name', mockWorkspaceRoot);
      assert.strictEqual(url, 'https://github.com/orgs/org/teams/team-name');
    });

    it('should generate correct URLs for simple team names in current org', () => {
      const url = getGitHubTeamUrl('team-name', mockWorkspaceRoot);
      assert(url && url.startsWith('https://github.com/orgs/') && url.includes('/teams/team-name'));
    });

    it('should handle complex team names with hyphens', () => {
      const url = getGitHubTeamUrl('@someorg/some-team-name', mockWorkspaceRoot);
      assert.strictEqual(url, 'https://github.com/orgs/someorg/teams/some-team-name');
    });

    it('should handle team names with underscores', () => {
      const url = getGitHubTeamUrl('@company/frontend_team', mockWorkspaceRoot);
      assert.strictEqual(url, 'https://github.com/orgs/company/teams/frontend_team');
    });

    it('should return null for email addresses', () => {
      const url = getGitHubTeamUrl('user@domain.com', mockWorkspaceRoot);
      assert.strictEqual(url, null);
    });

    it('should return null for empty strings', () => {
      const url = getGitHubTeamUrl('', mockWorkspaceRoot);
      assert.strictEqual(url, null);
    });

    it('should handle malformed team names gracefully', () => {
      const url = getGitHubTeamUrl('@', mockWorkspaceRoot);
      assert.strictEqual(url, null);
    });
  });

  describe('Integration tests', () => {
    const mockWorkspaceRoot = process.cwd();

    it('should correctly classify all team formats', () => {
      const testCases = [
        { name: 'team-name', isTeam: true, isUser: false },
        { name: 'org/team-name', isTeam: true, isUser: false },
        { name: '@org/team-name', isTeam: true, isUser: false },
        { name: '@username', isTeam: false, isUser: true },
        { name: 'user@domain.com', isTeam: false, isUser: false },
        { name: '@someorg/some-team-name', isTeam: true, isUser: false }
      ];

      testCases.forEach(({ name, isTeam, isUser }) => {
        assert.strictEqual(isGitHubTeam(name), isTeam, `isGitHubTeam("${name}") should be ${isTeam}`);
        assert.strictEqual(isGitHubUser(name), isUser, `isGitHubUser("${name}") should be ${isUser}`);
      });
    });

    it('should generate consistent URLs for same team in different formats', () => {
      const orgTeamUrl = getGitHubTeamUrl('org/team-name', mockWorkspaceRoot);
      const atOrgTeamUrl = getGitHubTeamUrl('@org/team-name', mockWorkspaceRoot);
      
      assert.strictEqual(orgTeamUrl, atOrgTeamUrl);
      assert.strictEqual(orgTeamUrl, 'https://github.com/orgs/org/teams/team-name');
    });
  });
});
