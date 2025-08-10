import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { isGitHubTeam, isGitHubUser, getGitHubTeamUrl } from "./helpers/githubTeamHelper";
import { localize } from "./localization";

export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  team: string,
  data: string,
  workspaceRoot?: string
) {
  const styleMainUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "main.css")
  );

  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "main.js")
  );

  const nonce = getNonce();

  // Check if this is a GitHub team/user and get the URL
  const isTeam = isGitHubTeam(team);
  const isUser = isGitHubUser(team);
  const isGitHub = isTeam || isUser;
  const githubUrl = workspaceRoot ? getGitHubTeamUrl(team, workspaceRoot) : null;
  
  // Debug logging
  console.log('Webview content generation:', {
    team,
    isTeam,
    isUser,
    isGitHub,
    githubUrl,
    workspaceRoot: !!workspaceRoot
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${localize("Code Ownership {0}").replace("{0}", team)}</title>

    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; media-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

    <link href="${styleMainUri}" rel="stylesheet">
</head>
<body>
  <div class="graph-content">
  ${data}
  </div>

  <div class="search">
    <div>
      <input class="button-4 search-input" placeholder="${localize("Search (Ctrl+F)")}" id="search" />
      <button class="button-4" id="search-prev" title="${localize("Previous match")}">&lt;</button>
      <button class="button-4" id="search-next" title="${localize("Next match")}">&gt;</button>
      <button class="button-4" id="copy-results" title="${localize("Copy all matches to the clipboard")}">&#x2398;</button>
      ${isGitHub ? `<button class="button-4" id="github-team" title="${isUser ? localize("Open GitHub User") : localize("Open GitHub Team")}">${isUser ? '👤 GitHub' : '🐙 GitHub'}</button>` : ''}
      <!-- Debug: isGitHub=${isGitHub}, isTeam=${isTeam}, isUser=${isUser}, team=${team} -->
    </div>
    <div>
      <span id="matches-count" />
    </div>
  </div>

  <div class="controls">
    <div class="buttons">
      <button class="button-4" id="zoom-in" title="${localize("Zoom in")}">+</button>
      <button class="button-4" id="zoom-reset" title="${localize("Reset zoom")}">O</button>
      <button class="button-4" id="zoom-out" title="${localize("Zoom out")}">-</button>
    </div>
  </div>

  <div id="simpleToast" />

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
