import * as vscode from "vscode";
import { generateGraph } from "./graph/generateGraph";
import { getWebviewContent } from "./getWebviewContent";
import { WebviewHandler } from "./WebviewHandler";
import { openGitHubTeam } from "./helpers/githubTeamHelper";

function addEventHandlers(
  panel: vscode.WebviewPanel,
  webviewHandler: WebviewHandler,
  workspaceRoot: string
) {
  panel.webview.onDidReceiveMessage(async (message) => {
    switch (message.command) {
      case "open":
        webviewHandler.navigateToHref(message.href);
        break;

      case "getDirectoryListing":
        webviewHandler.listDirectories(message.directory);
        break;

      case "copyToClipboard":
        webviewHandler.copyToClipboard(message.value);
        break;

      case "openGitHubTeam":
        try {
          console.log('Received openGitHubTeam message:', message);
          await openGitHubTeam(message.team, workspaceRoot);
        } catch (error) {
          console.error('Error opening GitHub team:', error);
          vscode.window.showErrorMessage(`Failed to open GitHub team: ${error instanceof Error ? error.message : String(error)}`);
        }
        break;
    }
  });
}

export function openGraphPanel(
  extensionUri: vscode.Uri,
  team: string,
  workspaceRoot: string
) {
  const panel = vscode.window.createWebviewPanel(
    "codeownersTeams.graphPanel",
    team,
    { viewColumn: vscode.ViewColumn.One, preserveFocus: true },
    { enableScripts: true, localResourceRoots: [extensionUri] }
  );

  const webviewHandler = new WebviewHandler(workspaceRoot, panel);

  addEventHandlers(panel, webviewHandler, workspaceRoot);

  generateGraph({
    workspaceRoot,
    team,
    addLinks: true,
    onFinish: (data) => {
      panel.webview.html = getWebviewContent(
        panel.webview,
        extensionUri,
        team,
        data,
        workspaceRoot
      );
    },
  });
}
