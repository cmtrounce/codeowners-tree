import * as vscode from "vscode";

/**
 * Determines if a team name is a GitHub team (not an email address)
 */
export function isGitHubTeam(teamName: string): boolean {
  // GitHub teams are typically in the format: organization/team-name, @org/team-name, or just team-name
  // Individual users are typically: @username
  // Email addresses are: user@domain.com
  const trimmed = teamName.trim();
  if (trimmed.length === 0) {
    return false;
  }
  
  // If it starts with @ and contains /, it's a GitHub team (@org/team format)
  if (trimmed.startsWith('@') && trimmed.includes('/')) {
    return true;
  }
  
  // If it starts with @ but no /, it's an individual GitHub user (not a team)
  if (trimmed.startsWith('@')) {
    return false;
  }
  
  // If it contains @ but not at the start, it's likely an email
  if (trimmed.includes('@')) {
    return false;
  }
  
  // If it contains /, it's likely a GitHub team (org/team-name)
  if (trimmed.includes('/')) {
    return true;
  }
  
  // If it's just a name without @ or /, it could be a team name
  // But we need to be more conservative - let's assume it's a team if it's not an email
  return true;
}

/**
 * Determines if a team name is an individual GitHub user
 */
export function isGitHubUser(teamName: string): boolean {
  const trimmed = teamName.trim();
  // If it starts with @ and contains /, it's a team (org/team format)
  if (trimmed.startsWith('@') && trimmed.includes('/')) {
    return false;
  }
  // If it starts with @ and no /, it's an individual user (but must have a username)
  return trimmed.startsWith('@') && !trimmed.includes('@', 1) && trimmed.length > 1;
}

/**
 * Generates a GitHub URL for the given team name (team or user)
 * Assumes the team is in the same organization as the current repository
 */
export function getGitHubTeamUrl(teamName: string, workspaceRoot: string): string | null {
  // Handle individual GitHub users
  if (isGitHubUser(teamName)) {
    const username = teamName.substring(1); // Remove the @
    return `https://github.com/${username}`;
  }
  
  // Handle GitHub teams
  if (!isGitHubTeam(teamName)) {
    return null;
  }

  // Try to extract organization from git remote
  try {
    const { execSync } = require('child_process');
    const gitRemote = execSync('git remote get-url origin', { 
      cwd: workspaceRoot, 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr to avoid errors if not a git repo
    }).trim();
    
    // Extract organization from git remote URL
    // Supports both HTTPS and SSH formats:
    // https://github.com/org/repo.git
    // git@github.com:org/repo.git
    const match = gitRemote.match(/github\.com[/:]([^/]+)/);
    if (match) {
      const organization = match[1];
      
      // If team name contains '/', handle org/team format
      if (teamName.includes('/')) {
        let org, team;
        if (teamName.startsWith('@')) {
          // @org/team format
          const parts = teamName.substring(1).split('/'); // Remove @ and split
          org = parts[0];
          team = parts[1];
        } else {
          // org/team format
          const parts = teamName.split('/');
          org = parts[0];
          team = parts[1];
        }
        return `https://github.com/orgs/${org}/teams/${team}`;
      } else {
        // Otherwise, assume it's just the team name in the current org
        return `https://github.com/orgs/${organization}/teams/${teamName}`;
      }
    }
  } catch (error) {
    // If git remote fails, we can't determine the organization
    console.warn('Could not determine GitHub organization from git remote:', error);
  }
  
  return null;
}

/**
 * Opens a GitHub team page in the default browser
 */
export async function openGitHubTeam(teamName: string, workspaceRoot: string): Promise<void> {
  const url = getGitHubTeamUrl(teamName, workspaceRoot);
  
  if (!url) {
    // If we can't generate a URL, try to open GitHub search for the team
    const searchUrl = `https://github.com/search?q=${encodeURIComponent(teamName)}&type=users`;
    await vscode.env.openExternal(vscode.Uri.parse(searchUrl));
    return;
  }
  
  await vscode.env.openExternal(vscode.Uri.parse(url));
}
