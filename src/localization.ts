import { l10n } from 'vscode';
import * as vscode from 'vscode';

export const localize = (message: string, ...args: any[]) => {
  try {
    const result = l10n.t(message, ...args);
    console.log(`Localize: message="${message}", result="${result}", locale="${vscode.env.language}"`);
    return result;
  } catch (error) {
    console.warn(`Localization failed for message "${message}":`, error);
    let result = message;
    args.forEach((arg, index) => {
      result = result.replace(`{${index}}`, String(arg));
    });
    return result;
  }
};
