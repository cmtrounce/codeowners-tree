import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export async function createCodeownersFile(workspaceRoot: string): Promise<void> {
  // Ask user where to create the file
  const location = await vscode.window.showQuickPick(
    [
      { label: "Root directory (CODEOWNERS)", description: "Most common location", value: "root" },
      { label: ".github/CODEOWNERS", description: "GitHub-specific location", value: ".github" },
      { label: "docs/CODEOWNERS", description: "Documentation folder", value: "docs" }
    ],
    {
      placeHolder: "Choose where to create the CODEOWNERS file",
      title: "Create CODEOWNERS File"
    }
  );

  if (!location) {
    return;
  }

  // Determine the file path
  let filePath: string;
  switch (location.value) {
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
    vscode.window.showErrorMessage(`CODEOWNERS file already exists at ${path.relative(workspaceRoot, filePath)}`);
    return;
  }

  // Create template content
  const template = generateCodeownersTemplate(workspaceRoot);

  try {
    // Write the file
    fs.writeFileSync(filePath, template, "utf8");

    // Show success message
    vscode.window.showInformationMessage(
      `CODEOWNERS file created at ${path.relative(workspaceRoot, filePath)}`,
      "Open File"
    ).then(selection => {
      if (selection === "Open File") {
        vscode.workspace.openTextDocument(filePath).then(doc => {
          vscode.window.showTextDocument(doc);
        });
      }
    });

    // Refresh the extension
    vscode.commands.executeCommand("codeownersTeams.refreshEntries");

  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create CODEOWNERS file: ${error instanceof Error ? error.message : String(error)}`);
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

# You can also use email addresses:
# *.md docs@example.com

# For more information, visit:
# https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
`;
}

export function openCodeownersDocs(): void {
  vscode.env.openExternal(vscode.Uri.parse("https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners"));
}
