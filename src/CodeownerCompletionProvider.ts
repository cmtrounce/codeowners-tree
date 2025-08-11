import * as vscode from 'vscode';
import { parseCodeownersLine } from './helpers/parseCodeownersLine';
import { isGitHubTeam } from './helpers/githubTeamHelper';
import { localize } from './localization';
import * as path from 'path';

export class CodeownerCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        
        // Only provide completions for CODEOWNERS files
        if (path.basename(document.uri.fsPath) !== 'CODEOWNERS') {
            return [];
        }

        const line = document.lineAt(position.line).text;
        const wordRange = document.getWordRangeAtPosition(position, /@[a-zA-Z0-9._-]*/);
        
        // Only provide completions when typing after @ symbol
        if (!wordRange || !line.includes('@')) {
            return [];
        }

        // Get what the user has typed so far (including the @)
        const currentWord = line.substring(wordRange.start.character, position.character);
        
        // If user hasn't typed anything after @, show all suggestions
        // If user has typed something, filter suggestions
        const shouldFilter = currentWord.length > 1;

        // Parse the current CODEOWNERS file to get existing codeowners
        const existingCodeowners = this.getExistingCodeowners(document);
        
        // Create completion items
        let completionItems: vscode.CompletionItem[] = existingCodeowners.map(codeowner => {
            const isTeam = isGitHubTeam(codeowner);
            const completionItem = new vscode.CompletionItem(
                codeowner,
                vscode.CompletionItemKind.Text // Use Text for better replacement behavior
            );
            
            completionItem.detail = isTeam ? `[${localize("Team")}]` : `[${localize("User")}]`;
            completionItem.insertText = codeowner; // Keep the full @team-name
            completionItem.range = wordRange; // Replace the entire word range
            completionItem.sortText = codeowner.toLowerCase();
            
            return completionItem;
        });

        // Filter suggestions if user has typed something after @
        if (shouldFilter) {
            const searchTerm = currentWord.substring(1).toLowerCase(); // Remove @ and convert to lowercase
            completionItems = completionItems.filter(item => 
                item.label.toString().toLowerCase().includes(searchTerm)
            );
        }

        return completionItems;
    }

    private getExistingCodeowners(document: vscode.TextDocument): string[] {
        const codeowners = new Set<string>();
        const content = document.getText();
        
        // Parse each line to extract existing codeowners
        const lines = content.split('\n');
        for (const line of lines) {
            const result = parseCodeownersLine(line);
            if (result && result.owners) {
                result.owners.forEach(owner => {
                    if (owner.startsWith('@')) {
                        codeowners.add(owner);
                    }
                });
            }
        }
        
        return Array.from(codeowners).sort();
    }
}
