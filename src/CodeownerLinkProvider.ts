import * as vscode from 'vscode';
import * as path from 'path';
import { parseCodeownersLine } from './helpers/parseCodeownersLine';
import { localize } from './localization';

export class CodeownerLinkProvider implements vscode.DocumentLinkProvider {
  provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.DocumentLink[] {
    const links: vscode.DocumentLink[] = [];
    
    // Only process CODEOWNERS files
    const fileName = path.basename(document.uri.fsPath);
    if (fileName !== 'CODEOWNERS') {
      return links;
    }

    const text = document.getText();
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = parseCodeownersLine(line);
      
      if (parsed && parsed.owners.length > 0) {
        // Get all links for this line
        const lineLinks = this.getLinksForLine(line, i, parsed.owners);
        links.push(...lineLinks);
      }
    }

    return links;
  }

  private getLinksForLine(line: string, lineNumber: number, owners: string[]): vscode.DocumentLink[] {
    const lineLinks: vscode.DocumentLink[] = [];
    
    // Get unique owners to avoid processing duplicates
    const uniqueOwners = [...new Set(owners)];
    
    for (const owner of uniqueOwners) {
      let lastIndex = 0;
      
      // Find all occurrences of this owner in the line
      let ownerIndex = line.indexOf(owner, lastIndex);
      while (ownerIndex !== -1) {
        const range = new vscode.Range(lineNumber, ownerIndex, lineNumber, ownerIndex + owner.length);
        
        // Create a command URI that will execute our command
        const commandUri = vscode.Uri.parse(`command:codeownersTeams.openGraphForCodeowner?${encodeURIComponent(JSON.stringify([owner]))}`);
        
        const link = new vscode.DocumentLink(range, commandUri);
        link.tooltip = localize("Click to open graph for {0}", owner);
        
        lineLinks.push(link);
        
        // Move to next position for next search
        lastIndex = ownerIndex + 1;
        ownerIndex = line.indexOf(owner, lastIndex);
      }
    }
    
    return lineLinks;
  }
}
