/**
 * Utility functions for matching file paths against CODEOWNERS patterns
 */

import { parseCodeownersLine } from "./parseCodeownersLine";
import { findCodeownersFile } from "./findCodeownersFile";
import * as fs from "fs";

export interface PathMatch {
  path: string;
  owners: string[];
}

/**
 * Finds the best matching CODEOWNERS rule for a given file path
 */
export function findBestMatch(filePath: string, codeownersContent: string): PathMatch | null {
  const lines = codeownersContent.split('\n');
  let bestMatch: PathMatch | null = null;

  for (const line of lines) {
    const parsed = parseCodeownersLine(line);
    if (!parsed) {
      continue;
    }

    if (pathMatches(filePath, parsed.path)) {
      // If this is a more specific match, use it
      if (!bestMatch || isMoreSpecific(parsed.path, bestMatch.path)) {
        bestMatch = parsed;
      }
    }
  }

  return bestMatch;
}

/**
 * Finds the codeowners for a specific file path
 */
export function findOwnersForFile(filePath: string, workspaceRoot: string): string[] {
  const codeownersPath = findCodeownersFile(workspaceRoot);
  if (!codeownersPath) {
    return [];
  }

  try {
    const codeownersContent = fs.readFileSync(codeownersPath, "utf-8");
    const bestMatch = findBestMatch(filePath, codeownersContent);
    return bestMatch ? bestMatch.owners : [];
  } catch (error) {
    console.error("Failed to read CODEOWNERS file:", error);
    return [];
  }
}

/**
 * Checks if a file path matches a CODEOWNERS pattern
 */
export function pathMatches(filePath: string, pattern: string): boolean {
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

/**
 * Determines if one path is more specific than another
 */
export function isMoreSpecific(path1: string, path2: string): boolean {
  // Exact matches are always more specific than directory matches
  const isExact1 = !path1.endsWith('/') && !path1.includes('*');
  const isExact2 = !path2.endsWith('/') && !path2.includes('*');
  
  if (isExact1 && !isExact2) {
    return true;
  }
  if (!isExact1 && isExact2) {
    return false;
  }
  
  // For same type (both exact or both directory), use depth
  const depth1 = path1.split('/').length;
  const depth2 = path2.split('/').length;
  return depth1 > depth2;
}
