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
        // Find the position of each owner in the line
        for (const owner of parsed.owners) {
          const ownerIndex = line.indexOf(owner);
          if (ownerIndex !== -1) {
            const range = new vscode.Range(i, ownerIndex, i, ownerIndex + owner.length);
            
            // Create a command URI that will execute our command
            const commandUri = vscode.Uri.parse(`command:codeownersTeams.openGraphForCodeowner?${encodeURIComponent(JSON.stringify([owner]))}`);
            
            const link = new vscode.DocumentLink(range, commandUri);
            link.tooltip = localize("Click to open graph for {0}", owner);
            
            links.push(link);
          }
        }
      }
    }

    return links;
  }
}
