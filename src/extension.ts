import * as vscode from "vscode";
import { CodeownerTeamsProvider, TeamTreeItem } from "./CodeownerTeamsProvider";
import { openGraphPanel } from "./openGraphPanel";
import { isGraphvizInstalled } from "./helpers/isGraphvizInstalled";
import { getWorkspaceRoot } from "./helpers/getWorkspaceRoot";
import { showNoGraphvizMessaage } from "./helpers/showNoGraphvizMessaage";
import { saveGraphAsFile } from "./saveGraphAsFile";
import { CodeownerTeamsPinner } from "./CodeownerTeamsPinner";
import { CodeownerStatusBar } from "./CodeownerStatusBar";
import { CodeownerHoverProvider } from "./CodeownerHoverProvider";
import * as path from "path";
import { findOwnersForFile } from "./helpers/pathMatcher";

export async function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = getWorkspaceRoot();

  const provider = new CodeownerTeamsProvider(workspaceRoot);
  const teamsPinner = new CodeownerTeamsPinner(provider);
  
  // Get configuration
  const config = vscode.workspace.getConfiguration('codeownersTeams');
  const showStatusBar = config.get<boolean>('showStatusBar', false);
  const showHoverInfo = config.get<boolean>('showHoverInfo', false);

  // Initialize status bar only if enabled
  let statusBar: CodeownerStatusBar | undefined;
  if (showStatusBar) {
    statusBar = new CodeownerStatusBar(workspaceRoot);
  }

  // Initialize hover provider only if enabled
  let hoverProvider: CodeownerHoverProvider | undefined;
  let hoverDisposable: vscode.Disposable | undefined;
  if (showHoverInfo) {
    hoverProvider = new CodeownerHoverProvider(workspaceRoot);
    hoverDisposable = vscode.languages.registerHoverProvider(
      { scheme: 'file' },
      hoverProvider
    );
    context.subscriptions.push(hoverDisposable);
  }

  vscode.window.registerTreeDataProvider("codeownersTeams", provider);

  if (!workspaceRoot) {
    vscode.window.showInformationMessage("No CODEOWNERS in empty workspace");
    return;
  }

  const isInstalled = await isGraphvizInstalled();
  if (!isInstalled) {
    showNoGraphvizMessaage();
  }

  vscode.commands.registerCommand("codeownersTeams.refreshEntries", () => {
    provider.refresh();
    if (statusBar) {
      statusBar.refresh();
    }
    if (hoverProvider) {
      hoverProvider.refresh();
    }
  });

  vscode.commands.registerCommand(
    "codeownersTeams.openGraph",
    (team: string) => {
      if (!isInstalled) {
        showNoGraphvizMessaage();
        return;
      }

      openGraphPanel(context.extensionUri, team, workspaceRoot);
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.openGraphForFile",
    async () => {
      if (!isInstalled) {
        showNoGraphvizMessaage();
        return;
      }

      // Get owners from status bar if available, otherwise find them manually
      let owners: string[] = [];
      if (statusBar) {
        owners = statusBar.getCurrentFileOwners();
      } else {
        // Fallback: find owners manually for the current file
        const editor = vscode.window.activeTextEditor;
        if (editor && workspaceRoot) {
          const filePath = editor.document.uri.fsPath;
          if (filePath.startsWith(workspaceRoot)) {
            const relativePath = path.relative(workspaceRoot, filePath);
            const normalizedPath = relativePath.replace(/\\/g, '/');
            owners = findOwnersForFile(normalizedPath, workspaceRoot);
          }
        }
      }

      if (owners.length === 0) {
        vscode.window.showInformationMessage("No CODEOWNERS found for current file");
        return;
      }

      if (owners.length === 1) {
        // Single owner - open graph directly
        openGraphPanel(context.extensionUri, owners[0], workspaceRoot);
      } else {
        // Multiple owners - show picker
        const selectedOwner = await vscode.window.showQuickPick(owners, {
          placeHolder: "Select a codeowner to view their graph",
          title: "Multiple CODEOWNERS found"
        });

        if (selectedOwner) {
          openGraphPanel(context.extensionUri, selectedOwner, workspaceRoot);
        }
      }
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.downloadGraph",
    (item: TeamTreeItem) => {
      if (!isInstalled) {
        showNoGraphvizMessaage();
        return;
      }

      saveGraphAsFile(item, workspaceRoot);
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.pinTeam",
    (item: TeamTreeItem) => {
      teamsPinner.pinTeam(item.label);
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.unpinTeam",
    (item: TeamTreeItem) => {
      teamsPinner.unpinTeam(item.label);
    }
  );

  // Register disposables
  if (statusBar) {
    context.subscriptions.push(statusBar);
  }
  if (hoverDisposable) {
    context.subscriptions.push(hoverDisposable);
  }

  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('codeownersTeams.showStatusBar') || 
          event.affectsConfiguration('codeownersTeams.showHoverInfo')) {
        
        // Reload the extension to apply new settings
        vscode.window.showInformationMessage(
          "CODEOWNERS Visualizer settings changed. Please reload the window to apply changes."
        );
      }
    })
  );
}

export function deactivate() {}
