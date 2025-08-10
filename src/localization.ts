import { l10n } from 'vscode';
import * as vscode from 'vscode';

// Use the new l10n API directly
// l10n.t() expects the default English message as first argument, which serves as the key
export const localize = (message: string, ...args: any[]) => {
  try {
    const result = l10n.t(message, ...args);
    console.log(`Localize: message="${message}", result="${result}", locale="${vscode.env.language}"`);
    return result;
  } catch (error) {
    console.warn(`Localization failed for message "${message}":`, error);
    // Fallback to default message with argument substitution
    let result = message;
    args.forEach((arg, index) => {
      result = result.replace(`{${index}}`, String(arg));
    });
    return result;
  }
};
