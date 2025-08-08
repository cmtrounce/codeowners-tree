import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { parseCodeownersLine } from "./helpers/parseCodeownersLine";
import { findCodeownersFile } from "./helpers/findCodeownersFile";

export class CodeownerStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private workspaceRoot: string | undefined;
  private codeownersPath: string | undefined;
  private codeownersContent: string | undefined;

  constructor(workspaceRoot: string | undefined) {
    this.workspaceRoot = workspaceRoot;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = "codeownersTeams.openGraphForFile";
    this.statusBarItem.tooltip = "Click to open CODEOWNERS graph for this file";
    
    this.findCodeownersFile();
    this.setupEventListeners();
  }

  private findCodeownersFile(): void {
    if (!this.workspaceRoot) {
      return;
    }

    this.codeownersPath = findCodeownersFile(this.workspaceRoot);
    if (this.codeownersPath) {
      this.loadCodeownersContent();
    }
  }

  private loadCodeownersContent(): void {
    if (!this.codeownersPath) {
      return;
    }

    try {
      this.codeownersContent = fs.readFileSync(this.codeownersPath, "utf-8");
    } catch (error) {
      console.error("Failed to read CODEOWNERS file:", error);
    }
  }

  private setupEventListeners(): void {
    // Update status bar when active text editor changes
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      this.updateStatusBar(editor);
    });

    // Update status bar when workspace changes
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      this.findCodeownersFile();
      this.updateStatusBar(vscode.window.activeTextEditor);
    });

    // Initial update
    this.updateStatusBar(vscode.window.activeTextEditor);
  }

  private updateStatusBar(editor: vscode.TextEditor | undefined): void {
    if (!editor || !this.codeownersContent || !this.workspaceRoot) {
      this.statusBarItem.hide();
      return;
    }

    const filePath = editor.document.uri.fsPath;
    
    // Check if the file is within the workspace
    if (!filePath.startsWith(this.workspaceRoot)) {
      this.statusBarItem.hide();
      return;
    }
    
    const relativePath = path.relative(this.workspaceRoot, filePath);
    
    // Convert Windows path separators to forward slashes for consistency
    const normalizedPath = relativePath.replace(/\\/g, '/');
    
    const owners = this.findOwnersForFile(normalizedPath);
    
    if (owners.length > 0) {
      this.statusBarItem.text = `$(shield) ${owners.join(', ')}`;
      this.statusBarItem.tooltip = `CODEOWNERS: ${owners.join(', ')}\nClick to open graph`;
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }
  }

  public findOwnersForFile(filePath: string): string[] {
    if (!this.codeownersContent) {
      return [];
    }

    const lines = this.codeownersContent.split('\n');
    let bestMatch: { path: string; owners: string[] } | null = null;

    for (const line of lines) {
      const parsed = parseCodeownersLine(line);
      if (!parsed) {
        continue;
      }

      if (this.pathMatches(filePath, parsed.path)) {
        // If this is a more specific match, use it
        if (!bestMatch || this.isMoreSpecific(parsed.path, bestMatch.path)) {
          bestMatch = parsed;
        }
      }
    }

    return bestMatch ? bestMatch.owners : [];
  }

  public pathMatches(filePath: string, pattern: string): boolean {
    // Simple path matching - this could be enhanced to support glob patterns
    if (pattern === '*') {
      return true;
    }

    if (pattern.endsWith('/')) {
      // Directory pattern
      return filePath.startsWith(pattern) || filePath === pattern.slice(0, -1);
    }

    if (pattern.includes('*')) {
      // Basic glob pattern support
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(filePath);
    }

    // Exact match
    return filePath === pattern;
  }

  public isMoreSpecific(path1: string, path2: string): boolean {
    // Simple heuristic: longer paths are more specific
    const depth1 = path1.split('/').length;
    const depth2 = path2.split('/').length;
    return depth1 > depth2;
  }

  public getCurrentFileOwners(): string[] {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this.workspaceRoot) {
      return [];
    }

    const filePath = editor.document.uri.fsPath;
    
    // Check if the file is within the workspace
    if (!filePath.startsWith(this.workspaceRoot)) {
      return [];
    }
    
    const relativePath = path.relative(this.workspaceRoot, filePath);
    const normalizedPath = relativePath.replace(/\\/g, '/');
    
    return this.findOwnersForFile(normalizedPath);
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
