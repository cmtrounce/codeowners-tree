import * as vscode from "vscode";
import { CodeownerTeamsProvider, TeamTreeItem } from "./CodeownerTeamsProvider";
import { openGraphPanel } from "./openGraphPanel";
import { isGraphvizInstalled } from "./helpers/isGraphvizInstalled";
import { getWorkspaceRoot } from "./helpers/getWorkspaceRoot";
import { showNoGraphvizMessaage } from "./helpers/showNoGraphvizMessaage";
import { saveGraphAsFile } from "./saveGraphAsFile";
import { CodeownerTeamsPinner } from "./CodeownerTeamsPinner";
import { CodeownerStatusBar } from "./CodeownerStatusBar";

export async function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = getWorkspaceRoot();

  const provider = new CodeownerTeamsProvider(workspaceRoot);
  const teamsPinner = new CodeownerTeamsPinner(provider);
  const statusBar = new CodeownerStatusBar(workspaceRoot);

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

      const owners = statusBar.getCurrentFileOwners();
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
  context.subscriptions.push(statusBar);
}

export function deactivate() {}
