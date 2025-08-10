import * as vscode from "vscode";

/**
 * Determines if a team name is a GitHub team (not an email address)
 */
export function isGitHubTeam(teamName: string): boolean {
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

/**
 * Determines if a team name is an individual GitHub user
 */
export function isGitHubUser(teamName: string): boolean {
  const trimmed = teamName.trim();
  if (trimmed.startsWith('@') && trimmed.includes('/')) {
    return false;
  }
  return trimmed.startsWith('@') && !trimmed.includes('@', 1) && trimmed.length > 1;
}

/**
 * Generates a GitHub URL for the given team name (team or user)
 * Assumes the team is in the same organization as the current repository
 */
export function getGitHubTeamUrl(teamName: string, workspaceRoot: string): string | null {
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
