/**
 * Utility functions for matching file paths against CODEOWNERS patterns
 */

import { parseCodeownersLine } from "./parseCodeownersLine";
import { findCodeownersFile } from "./findCodeownersFile";
import { minimatch } from "minimatch";
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
  // Normalize path separators for cross-platform compatibility
  // Only convert path separators, not escape sequences
  const normalizedFilePath = filePath.replace(/\\/g, '/');
  
  // For patterns, we need to be careful not to break escape sequences
  // Only convert standalone backslashes that are path separators
  // Don't convert escaped special characters: \* \? \[ \] \{ \} \space
  const normalizedPattern = pattern.replace(/\\(?![*?[\]{}\s])/g, '/');

  // Special case: directory patterns ending with /
  if (normalizedPattern.endsWith('/')) {
    return normalizedFilePath.startsWith(normalizedPattern) || normalizedFilePath === normalizedPattern.slice(0, -1);
  }

  // Use minimatch for all other patterns (including * which it handles correctly)
  return minimatch(normalizedFilePath, normalizedPattern, {
    dot: true,        // Match dotfiles
    nocase: false,    // Case sensitive (matches CODEOWNERS behavior)
    matchBase: false, // Don't match basename only
    nobrace: false,   // Enable brace expansion {a,b}
    noext: false,     // Enable extended glob patterns
    noglobstar: false // Enable ** patterns
  });
}

/**
 * Determines if one path is more specific than another using lexicographic comparison
 * Rules are applied in priority order
 */
export function isMoreSpecific(path1: string, path2: string): boolean {
  // 1. Exact paths always win over glob patterns
  const isExact1 = isExactPath(path1);
  const isExact2 = isExactPath(path2);
  
  if (isExact1 && !isExact2) {
    return true;
  }
  if (!isExact1 && isExact2) {
    return false;
  }
  
  // If both are exact paths at the same depth, neither is more specific
  if (isExact1 && isExact2) {
    const depth1 = getPathDepth(path1);
    const depth2 = getPathDepth(path2);
    if (depth1 === depth2) {
      return false; // Equal specificity
    }
    return depth1 > depth2; // Deeper paths are more specific
  }
  
  // 2. File patterns win over directory patterns (higher priority than recursive check)
  const isDir1 = isDirectoryPattern(path1);
  const isDir2 = isDirectoryPattern(path2);
  
  if (!isDir1 && isDir2) {
    return true;
  }
  if (isDir1 && !isDir2) {
    return false;
  }
  
  // 3. Non-recursive patterns win over recursive ones
  const hasRecursive1 = hasRecursiveWildcard(path1);
  const hasRecursive2 = hasRecursiveWildcard(path2);
  
  if (!hasRecursive1 && hasRecursive2) {
    return true;
  }
  if (hasRecursive1 && !hasRecursive2) {
    return false;
  }
  
  // 4. Patterns with exact file extensions win over patterns with multiple alternatives
  const hasExactExt1 = hasExactFileExtension(path1);
  const hasExactExt2 = hasExactFileExtension(path2);
  
  if (hasExactExt1 && !hasExactExt2) {
    return true;
  }
  if (!hasExactExt1 && hasExactExt2) {
    return false;
  }
  
  // 5. Fewer alternatives win over more alternatives (brace expansion)
  const alternatives1 = countBraceAlternatives(path1);
  const alternatives2 = countBraceAlternatives(path2);
  
  if (alternatives1 < alternatives2) {
    return true;
  }
  if (alternatives1 > alternatives2) {
    return false;
  }
  
  // 6. More literal characters win over fewer literal characters
  const literals1 = countLiteralCharacters(path1);
  const literals2 = countLiteralCharacters(path2);
  
  if (literals1 > literals2) {
    return true;
  }
  if (literals1 < literals2) {
    return false;
  }
  
  // 7. Question marks win over single wildcards (more constrained)
  const questionMarks1 = countQuestionMarks(path1);
  const questionMarks2 = countQuestionMarks(path2);
  const singleWildcards1 = countSingleWildcards(path1);
  const singleWildcards2 = countSingleWildcards(path2);
  
  // If one has question marks and the other has single wildcards, question marks win
  if (questionMarks1 > 0 && singleWildcards2 > 0 && questionMarks2 === 0) {
    return true;
  }
  if (questionMarks2 > 0 && singleWildcards1 > 0 && questionMarks1 === 0) {
    return false;
  }
  
  // 8. Deeper paths win over shallower paths (final tiebreaker)
  const depth1 = getPathDepth(path1);
  const depth2 = getPathDepth(path2);
  
  return depth1 > depth2;
}

/**
 * Helper functions for lexicographic pattern comparison
 * Each function checks a specific aspect of pattern specificity
 */

/**
 * Checks if a pattern is an exact path (no wildcards or special characters)
 */
function isExactPath(pattern: string): boolean {
  return !pattern.endsWith('/') && 
         !pattern.includes('*') && 
         !pattern.includes('?') && 
         !pattern.includes('[') && 
         !pattern.includes('{');
}

/**
 * Checks if a pattern contains recursive wildcards (**)
 */
function hasRecursiveWildcard(pattern: string): boolean {
  return pattern.includes('**');
}

/**
 * Checks if a pattern is a directory pattern (ends with /)
 */
function isDirectoryPattern(pattern: string): boolean {
  return pattern.endsWith('/');
}

/**
 * Checks if a pattern has an exact file extension (not a pattern)
 */
function hasExactFileExtension(pattern: string): boolean {
  if (!pattern.includes('.')) {
    return false;
  }
  
  const extension = pattern.split('.').pop() || '';
  return extension.length > 0 && 
         !extension.includes('*') && 
         !extension.includes('?') && 
         !extension.includes('[') && 
         !extension.includes('{');
}

/**
 * Counts the number of alternatives in brace expansions
 * Returns 0 if no brace expansion, otherwise counts alternatives
 */
function countBraceAlternatives(pattern: string): number {
  const braceMatches = pattern.match(/\{[^}]+\}/g);
  if (!braceMatches) {
    return 0;
  }
  
  let totalAlternatives = 0;
  for (const match of braceMatches) {
    const content = match.slice(1, -1); // Remove { and }
    const alternatives = content.split(',').length;
    totalAlternatives += alternatives;
  }
  
  return totalAlternatives;
}

/**
 * Counts literal characters (non-wildcard characters)
 */
function countLiteralCharacters(pattern: string): number {
  return pattern.replace(/[*?[\]{}]/g, '').length;
}

/**
 * Gets the path depth (number of segments)
 */
function getPathDepth(pattern: string): number {
  return pattern.split('/').length;
}

/**
 * Counts question marks in a pattern
 */
function countQuestionMarks(pattern: string): number {
  return (pattern.match(/\?/g) || []).length;
}

/**
 * Counts single wildcards (not recursive) in a pattern
 */
function countSingleWildcards(pattern: string): number {
  const totalWildcards = (pattern.match(/\*/g) || []).length;
  const recursiveWildcards = (pattern.match(/\*\*/g) || []).length;
  return totalWildcards - (recursiveWildcards * 2);
}
