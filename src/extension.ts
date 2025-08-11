import * as vscode from "vscode";
import * as path from "path";
import { CodeownerTeamsProvider } from "./CodeownerTeamsProvider";
import { CodeownerTeamsPinner } from "./CodeownerTeamsPinner";
import { CodeownerStatusBar } from "./CodeownerStatusBar";
import { CodeownerHoverProvider } from "./CodeownerHoverProvider";
import { CodeownerLinkProvider } from "./CodeownerLinkProvider";
import { CodeownerCompletionProvider } from "./CodeownerCompletionProvider";
import { openGraphPanel } from "./openGraphPanel";
import { saveGraphAsFile } from "./saveGraphAsFile";
import { analyzeCoverage } from "./helpers/coverageAnalyzer";
import { openCoveragePanel } from "./coveragePanel";
import { openGitHubTeam } from "./helpers/githubTeamHelper";
import { createCodeownersFile } from "./helpers/createCodeownersFile";
import { openCodeownersDocs } from "./helpers/createCodeownersFile";
import { getWorkspaceRoot } from "./helpers/getWorkspaceRoot";
import { isGraphvizInstalled } from "./helpers/isGraphvizInstalled";
import { showNoGraphvizMessage } from "./helpers/showNoGraphvizMessaage";
import { findOwnersForFile } from "./helpers/pathMatcher";
import { NoCodeownersFileError } from "./helpers/coverageAnalyzer";
import { localize } from "./localization";
import * as fs from "fs";

export async function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = getWorkspaceRoot();

  const provider = new CodeownerTeamsProvider(workspaceRoot);
  const teamsPinner = new CodeownerTeamsPinner(provider);
  
  const config = vscode.workspace.getConfiguration('codeownersTeams');
  const showStatusBar = config.get<boolean>('showStatusBar', false);
  const showHoverInfo = config.get<boolean>('showHoverInfo', false);

  let statusBar: CodeownerStatusBar | undefined;
  if (showStatusBar) {
    statusBar = new CodeownerStatusBar(workspaceRoot);
  }

  // Temporarily disable hover provider to test link provider in isolation
  // let hoverProvider: CodeownerHoverProvider | undefined;
  // let hoverDisposable: vscode.Disposable | undefined;
  // if (showHoverInfo) {
  //   hoverProvider = new CodeownerHoverProvider(workspaceRoot);
  //   // Register hover provider for all files EXCEPT CODEOWNERS files
  //   hoverDisposable = vscode.languages.registerHoverProvider(
  //     { scheme: 'file', pattern: '**/*' },
  //     hoverProvider
  //   );
  //   context.subscriptions.push(hoverDisposable);
  // }

  // Register link provider for clickable codeowners
  const linkProvider = new CodeownerLinkProvider();
  const linkDisposable = vscode.languages.registerDocumentLinkProvider(
    { language: 'codeowners' },
    linkProvider
  );
  context.subscriptions.push(linkDisposable);

  // Register completion provider for codeowner suggestions
  const completionProvider = new CodeownerCompletionProvider();
  const completionDisposable = vscode.languages.registerCompletionItemProvider(
    { language: 'codeowners' },
    completionProvider,
    '@'
  );
  context.subscriptions.push(completionDisposable);

  vscode.window.registerTreeDataProvider("codeownersTeams", provider);

  if (!workspaceRoot) {
    vscode.window.showInformationMessage(localize("No CODEOWNERS found in empty workspace"));
    return;
  }

  const isInstalled = await isGraphvizInstalled();
  if (!isInstalled) {
    showNoGraphvizMessage();
  }

  const refreshAllComponents = () => {
    provider.refresh();
    if (statusBar) {
      statusBar.refresh();
    }
    // if (hoverProvider) {
    //   hoverProvider.refresh();
    // }
    // Link provider doesn't need manual refresh
  };

  const handleNoCodeownersFileError = async (context: string) => {
    const action = await vscode.window.showErrorMessage(
      localize("No CODEOWNERS file found in {0}", context),
      localize("Create CODEOWNERS File"),
      localize("Open CODEOWNERS Documentation")
    );
    
    if (action === localize("Create CODEOWNERS File")) {
      try {
        await createCodeownersFile(workspaceRoot);
      } catch (createError) {
        vscode.window.showErrorMessage(localize("Failed to create CODEOWNERS file: {0}", createError instanceof Error ? createError.message : String(createError)));
      }
    } else if (action === localize("Open CODEOWNERS Documentation")) {
      openCodeownersDocs();
    }
  };

  const codeownersWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceRoot, "**/CODEOWNERS")
  );

  codeownersWatcher.onDidCreate(refreshAllComponents);
  codeownersWatcher.onDidChange(refreshAllComponents);
  codeownersWatcher.onDidDelete(refreshAllComponents);

  context.subscriptions.push(codeownersWatcher);

  vscode.commands.registerCommand("codeownersTeams.refreshEntries", refreshAllComponents);

  vscode.commands.registerCommand(
    "codeownersTeams.openGraph",
    (team: string) => {
      if (!isInstalled) {
        showNoGraphvizMessage();
        return;
      }

      openGraphPanel(context.extensionUri, team, workspaceRoot);
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.openGraphForCodeowner",
    (team: string) => {
      if (!isInstalled) {
        showNoGraphvizMessage();
        return;
      }

      // Extract team name from the clicked text (remove @ if present)
      const cleanTeam = team.startsWith('@') ? team : `@${team}`;
      openGraphPanel(context.extensionUri, cleanTeam, workspaceRoot);
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.openGraphForFile",
    async () => {
      if (!isInstalled) {
        showNoGraphvizMessage();
        return;
      }

      let owners: string[] = [];
      if (statusBar) {
        owners = statusBar.getCurrentFileOwners();
      } else {
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
        vscode.window.showInformationMessage(localize("No CODEOWNERS found for current file"));
        return;
      }

      if (owners.length === 1) {
        openGraphPanel(context.extensionUri, owners[0], workspaceRoot);
      } else {
        const selected = await vscode.window.showQuickPick(owners, {
          title: localize("Open Graph for File")
        });

        if (selected) {
          openGraphPanel(context.extensionUri, selected, workspaceRoot);
        }
      }
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.downloadGraph",
    async (team: any) => {
      if (!isInstalled) {
        showNoGraphvizMessage();
        return;
      }

      saveGraphAsFile(team, workspaceRoot);
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.analyzeCoverage",
    async () => {
      if (!workspaceRoot) {
        vscode.window.showErrorMessage(localize("No workspace found"));
        return;
      }

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: localize("Analyzing CODEOWNERS coverage..."),
            cancellable: false
          },
          async (progress) => {
            progress.report({ increment: 0 });
            const analysis = analyzeCoverage(workspaceRoot);
            progress.report({ increment: 100 });
            openCoveragePanel(context, analysis);
          }
        );
      } catch (error) {
        if (error instanceof NoCodeownersFileError) {
          await handleNoCodeownersFileError(localize("Analyze Coverage"));
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(localize("Coverage analysis failed: {0}", errorMessage));
        }
      }
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.exportCoverage",
    async () => {
      if (!workspaceRoot) {
        vscode.window.showErrorMessage(localize("No workspace found"));
        return;
      }

      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: localize("Exporting CODEOWNERS coverage..."),
            cancellable: false
          },
          async (progress) => {
            progress.report({ increment: 0 });
            const analysis = analyzeCoverage(workspaceRoot);
            progress.report({ increment: 50 });

            const uri = await vscode.window.showSaveDialog({
              filters: {
                'markdown': ['md'],
                'json': ['json'],
                'text': ['txt']
              }
            });

            if (uri) {
              const extension = path.extname(uri.fsPath).toLowerCase();
              
              let content: string;
              if (extension === '.json') {
                content = JSON.stringify(analysis, null, 2);
              } else {
                const coverageColor = analysis.coveragePercentage >= 80 ? "🟢" : 
                                   analysis.coveragePercentage >= 60 ? "🟡" : "🔴";
                
                content = `# CODEOWNERS Coverage Report

Generated on: ${analysis.scanDate.toLocaleString()}

## 📊 Overall Coverage

${coverageColor} **${analysis.coveragePercentage.toFixed(1)}% Coverage**

- **Total Files**: ${analysis.totalFiles}
- **Covered Files**: ${analysis.coveredFiles}
- **Uncovered Files**: ${analysis.totalFiles - analysis.coveredFiles}

## 📁 Top Uncovered Directories

${analysis.uncoveredDirectories.map(dir => `
### ${dir.path}
- **Coverage**: ${dir.coveragePercentage.toFixed(1)}%
- **Files**: ${dir.coveredFiles}/${dir.totalFiles} covered
- **Uncovered**: ${dir.uncoveredFiles} files
`).join('\n')}

## 📄 Coverage by File Type

${analysis.fileTypeCoverage.map(type => `
### ${type.extension}
- **Coverage**: ${type.coveragePercentage.toFixed(1)}%
- **Files**: ${type.coveredFiles}/${type.totalFiles} covered
- **Uncovered**: ${type.uncoveredFiles} files
`).join('\n')}

## 👥 Team Coverage Distribution

${analysis.teamCoverage.map(team => `
### ${team.team}
- **Files**: ${team.totalFiles}
- **Percentage of Total**: ${team.percentageOfTotal.toFixed(1)}%
`).join('\n')}

---

*Report generated by CODEOWNERS Visualizer extension*`;
              }
              
              fs.writeFileSync(uri.fsPath, content, 'utf-8');
              progress.report({ increment: 100 });
              vscode.window.showInformationMessage(localize("Coverage report exported to {0}", uri.fsPath));
            }
          }
        );
      } catch (error) {
        if (error instanceof NoCodeownersFileError) {
          await handleNoCodeownersFileError(localize("Export Coverage"));
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          vscode.window.showErrorMessage(localize("Export failed: {0}", errorMessage));
        }
      }
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.pinTeam",
    (team: any) => {
      teamsPinner.pinTeam(team.label);
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.unpinTeam",
    (team: any) => {
      teamsPinner.unpinTeam(team.label);
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.openGitHubTeam",
    async (team: any) => {
      if (!workspaceRoot) {
        vscode.window.showErrorMessage(localize("No workspace found"));
        return;
      }

      try {
        await openGitHubTeam(team.label, workspaceRoot);
      } catch (error) {
        vscode.window.showErrorMessage(localize("Failed to open GitHub team: {0}", error instanceof Error ? error.message : String(error)));
      }
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.createCodeownersFile",
    async () => {
      if (!workspaceRoot) {
        vscode.window.showErrorMessage(localize("No workspace found"));
        return;
      }

      try {
        await createCodeownersFile(workspaceRoot);
      } catch (error) {
        vscode.window.showErrorMessage(localize("Failed to create CODEOWNERS file: {0}", error instanceof Error ? error.message : String(error)));
      }
    }
  );

  vscode.commands.registerCommand(
    "codeownersTeams.openCodeownersDocs",
    () => {
      openCodeownersDocs();
    }
  );

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('codeownersTeams.showStatusBar')) {
      const newShowStatusBar = vscode.workspace.getConfiguration('codeownersTeams').get<boolean>('showStatusBar', false);
      
      if (newShowStatusBar && !statusBar) {
        statusBar = new CodeownerStatusBar(workspaceRoot);
      } else if (!newShowStatusBar && statusBar) {
        statusBar.dispose();
        statusBar = undefined;
      }
    }

    // Temporarily disabled hover provider configuration
    // if (event.affectsConfiguration('codeownersTeams.showHoverInfo')) {
    //   const newShowHoverInfo = vscode.workspace.getConfiguration('codeownersTeams').get<boolean>('showHoverInfo', false);
    //   
    //   if (newShowHoverInfo && !hoverProvider) {
    //     hoverProvider = new CodeownerHoverProvider(workspaceRoot);
    //     hoverDisposable = vscode.languages.registerHoverProvider(
    //       { scheme: 'file' },
    //       hoverProvider
    //     );
    //     context.subscriptions.push(hoverDisposable);
    //   } else if (!newShowHoverInfo && hoverProvider) {
    //     if (hoverDisposable) {
    //       hoverDisposable.dispose();
    //       hoverDisposable = undefined;
    //     }
    //     hoverProvider = undefined;
    //   }
    // }
  });

  context.subscriptions.push(
    vscode.Disposable.from(
    )
  );
}

export function deactivate() {}
