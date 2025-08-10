import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { localize } from "../localization";

export async function createCodeownersFile(workspaceRoot: string): Promise<void> {
  // Ask user where to create the file
  const options = [
    { label: localize("./CODEOWNERS"), description: localize("Repository root - main project file"), value: "root" },
    { label: localize(".github/CODEOWNERS"), description: localize("GitHub standard location - recommended for GitHub repos"), value: ".github" },
    { label: localize("docs/CODEOWNERS"), description: localize("Documentation directory - for project docs"), value: "docs" }
  ];

  const selection = await vscode.window.showQuickPick(options, {
    placeHolder: localize("Choose where to create the CODEOWNERS file"),
    title: localize("Create CODEOWNERS File")
  });

  if (!selection) {
    return;
  }

  // Determine the file path
  let filePath: string;
  switch (selection.value) {
    case "root":
      filePath = path.join(workspaceRoot, "CODEOWNERS");
      break;
    case ".github":
      // Create .github directory if it doesn't exist
      const githubDir = path.join(workspaceRoot, ".github");
      if (!fs.existsSync(githubDir)) {
        fs.mkdirSync(githubDir, { recursive: true });
      }
      filePath = path.join(githubDir, "CODEOWNERS");
      break;
    case "docs":
      // Create docs directory if it doesn't exist
      const docsDir = path.join(workspaceRoot, "docs");
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      filePath = path.join(docsDir, "CODEOWNERS");
      break;
    default:
      return;
  }

  // Check if file already exists
  if (fs.existsSync(filePath)) {
    vscode.window.showErrorMessage(localize("CODEOWNERS file already exists at {0}", path.relative(workspaceRoot, filePath)));
    return;
  }

  // Create template content
  const template = generateCodeownersTemplate(workspaceRoot);

  try {
    // Write the file
    fs.writeFileSync(filePath, template, "utf8");

    // Show success message
    const selection = await vscode.window.showInformationMessage(
      localize("CODEOWNERS file created at {0}", path.relative(workspaceRoot, filePath)),
      localize("Open File")
    );

    if (selection === localize("Open File")) {
      vscode.workspace.openTextDocument(filePath).then(doc => {
        vscode.window.showTextDocument(doc);
      });
    }

    // Refresh the extension
    vscode.commands.executeCommand("codeownersTeams.refreshEntries");

  } catch (error) {
    vscode.window.showErrorMessage(localize("Failed to create CODEOWNERS file: {0}", error instanceof Error ? error.message : String(error)));
  }
}

function generateCodeownersTemplate(workspaceRoot: string): string {
  // Get workspace name for the template
  const workspaceName = path.basename(workspaceRoot);
  
  return `# CODEOWNERS file for ${workspaceName}
# This file defines who is responsible for code in a repository.
# Each line is a file pattern followed by one or more owners.
# Order is important; the last matching pattern takes precedence.

# Global owners - these people will be the default owners for everything in
# the repository unless a later match takes precedence.
* @your-team-name

# Example patterns:
# *.js @frontend-team
# *.py @backend-team
# docs/ @docs-team
# tests/ @qa-team

`;
}

export function openCodeownersDocs(): void {
  vscode.env.openExternal(vscode.Uri.parse("https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners"));
}
