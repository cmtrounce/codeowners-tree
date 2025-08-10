import * as vscode from "vscode";
import * as path from "path";
import { findCodeownersFile } from "./helpers/findCodeownersFile";
import { findBestMatch } from "./helpers/pathMatcher";
import * as fs from "fs";
import { localize } from "./localization";

export class CodeownerHoverProvider implements vscode.HoverProvider {
  private workspaceRoot: string | undefined;
  private codeownersContent: string | undefined;

  constructor(workspaceRoot: string | undefined) {
    this.workspaceRoot = workspaceRoot;
    this.loadCodeownersContent();
  }

  private loadCodeownersContent(): void {
    if (!this.workspaceRoot) {
      return;
    }

    const codeownersPath = findCodeownersFile(this.workspaceRoot);
    if (!codeownersPath) {
      return;
    }

    try {
      this.codeownersContent = fs.readFileSync(codeownersPath, "utf-8");
    } catch (error) {
      console.error("Failed to read CODEOWNERS file:", error);
    }
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    if (!this.workspaceRoot || !this.codeownersContent) {
      return null;
    }

    const filePath = document.uri.fsPath;
    
    // Check if the file is within the workspace
    if (!filePath.startsWith(this.workspaceRoot)) {
      return null;
    }

    const relativePath = path.relative(this.workspaceRoot, filePath);
    const normalizedPath = relativePath.replace(/\\/g, '/');
    
    const owners = this.findOwnersForFile(normalizedPath);
    
    if (owners.length === 0) {
      return null;
    }

    // Create hover content
    const ownerList = owners.map(owner => `• ${owner}`).join('\n');
    const hoverContent = new vscode.MarkdownString();
    
    hoverContent.appendMarkdown(`**${localize("CODEOWNERS")}**\n\n`);
    hoverContent.appendMarkdown(`${ownerList}\n\n`);
    
    if (owners.length === 1) {
      // Single owner - direct command
      hoverContent.appendMarkdown(`[${localize("Click to view ownership graph")}](command:codeownersTeams.openGraph?${encodeURIComponent(JSON.stringify(owners[0]))})`);
    } else {
      // Multiple owners - use the file-specific command
      hoverContent.appendMarkdown(`[${localize("Click to view ownership graph for file")}](command:codeownersTeams.openGraphForFile)`);
    }
    
    // Make the hover content interactive
    hoverContent.isTrusted = true;
    
    const hover = new vscode.Hover(hoverContent);
    hover.range = new vscode.Range(position, position);
    
    return hover;
  }

  private findOwnersForFile(filePath: string): string[] {
    if (!this.codeownersContent) {
      return [];
    }

    const bestMatch = findBestMatch(filePath, this.codeownersContent);
    return bestMatch ? bestMatch.owners : [];
  }

  public refresh(): void {
    this.loadCodeownersContent();
  }
}
