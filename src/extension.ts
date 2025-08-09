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
import { openCoveragePanel } from "./coveragePanel";
import { analyzeCoverage, NoCodeownersFileError } from "./helpers/coverageAnalyzer";
import * as path from "path";
import { findOwnersForFile } from "./helpers/pathMatcher";
import { generateCoverageReport } from "./helpers/coverageExporter";
import { openGitHubTeam } from "./helpers/githubTeamHelper";
import { createCodeownersFile, openCodeownersDocs } from "./helpers/createCodeownersFile";

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

  // Helper function to refresh all components
  const refreshAllComponents = () => {
    provider.refresh();
    if (statusBar) {
      statusBar.refresh();
    }
    if (hoverProvider) {
      hoverProvider.refresh();
    }
  };

  // Helper function to handle NoCodeownersFileError with call-to-action
  const handleNoCodeownersFileError = async (context: string) => {
    const action = await vscode.window.showErrorMessage(
      `No CODEOWNERS file found in this workspace. ${context} requires a CODEOWNERS file to work.`,
      "Create CODEOWNERS File",
      "Learn More"
    );
    
    if (action === "Create CODEOWNERS File") {
      try {
        await createCodeownersFile(workspaceRoot);
      } catch (createError) {
        vscode.window.showErrorMessage(`Failed to create CODEOWNERS file: ${createError instanceof Error ? createError.message : String(createError)}`);
      }
    } else if (action === "Learn More") {
      openCodeownersDocs();
    }
  };

  // Set up file watcher for CODEOWNERS file changes
  const codeownersWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceRoot, "**/CODEOWNERS")
  );

  codeownersWatcher.onDidCreate(refreshAllComponents);
  codeownersWatcher.onDidChange(refreshAllComponents);
  codeownersWatcher.onDidDelete(refreshAllComponents);

  // Add watcher to subscriptions
  context.subscriptions.push(codeownersWatcher);

  vscode.commands.registerCommand("codeownersTeams.refreshEntries", refreshAllComponents);

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
    "codeownersTeams.analyzeCoverage",
    async () => {
      if (!workspaceRoot) {
        vscode.window.showErrorMessage("No workspace found");
        return;
      }

      try {
        // Show progress notification
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
          title: "Analyzing CODEOWNERS coverage...",
          cancellable: false
        }, async (progress) => {
          progress.report({ increment: 0 });
          
          const analysis = analyzeCoverage(workspaceRoot);
          
          progress.report({ increment: 100 });
          
          // Open coverage panel
          openCoveragePanel(context, analysis);
          
          vscode.window.showInformationMessage(
            `Coverage analysis complete: ${analysis.coveragePercentage.toFixed(1)}% coverage`
          );
        });
      } catch (error) {
        if (error instanceof NoCodeownersFileError) {
          await handleNoCodeownersFileError("Coverage analysis");
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`Coverage analysis failed: ${errorMessage}`);
        }
      }
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.exportCoverage",
    async () => {
      if (!workspaceRoot) {
        vscode.window.showErrorMessage("No workspace found");
        return;
      }

      try {
        const analysis = analyzeCoverage(workspaceRoot);
        
        // Create export content
        const exportContent = generateCoverageReport(analysis);
        
        // Show save dialog
        const uri = await vscode.window.showSaveDialog({
          filters: {
            json: ['json'],
            markdown: ['md'],
            text: ['txt']
          },
        });
        
        if (uri) {
          const fs = require('fs');
          const extension = path.extname(uri.fsPath).toLowerCase();
          
          let content: string;
          if (extension === '.json') {
            content = JSON.stringify(analysis, null, 2);
          } else {
            content = exportContent;
          }
          
          fs.writeFileSync(uri.fsPath, content, 'utf-8');
          vscode.window.showInformationMessage(`Coverage report exported to ${uri.fsPath}`);
        }
      } catch (error) {
        if (error instanceof NoCodeownersFileError) {
          await handleNoCodeownersFileError("Coverage export");
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(`Export failed: ${errorMessage}`);
        }
      }
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

  vscode.commands.registerCommand(
    "codeownersTeams.openGitHubTeam",
    async (item: TeamTreeItem) => {
      if (!workspaceRoot) {
        vscode.window.showErrorMessage("No workspace found");
        return;
      }

      try {
        await openGitHubTeam(item.label, workspaceRoot);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to open GitHub team: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.createCodeownersFile",
    async () => {
      if (!workspaceRoot) {
        vscode.window.showErrorMessage("No workspace found");
        return;
      }

      try {
        await createCodeownersFile(workspaceRoot);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to create CODEOWNERS file: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.openCodeownersDocs",
    () => {
      openCodeownersDocs();
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
