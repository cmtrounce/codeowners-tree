/**
 * Parses a single line from a CODEOWNERS file, properly handling escaped spaces.
 * 
 * @param line - The raw line from the CODEOWNERS file
 * @returns Object containing the path and array of owners, or null if line is empty/comment only
 */
export function parseCodeownersLine(line: string): { path: string; owners: string[] } | null {
  // Remove comments
  let lineWithoutComment = line;
  
  // Check if entire line is a comment (starts with #)
  if (line.trim().startsWith('#')) {
    return null;
  }
  
  // Check for inline comments (# preceded by whitespace)
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '#' && i > 0 && (line[i-1] === ' ' || line[i-1] === '\t')) {
      lineWithoutComment = line.substring(0, i).trimEnd();
      break;
    }
  }

  // Check if line is empty after comment removal
  if (!lineWithoutComment || lineWithoutComment.trim() === '') {
    return null;
  }

  // Parse the line character by character to handle escaped spaces properly
  let currentToken = '';
  let tokens = [];
  
  for (let i = 0; i < lineWithoutComment.length; i++) {
    const char = lineWithoutComment[i];
    
    if (char === '\\' && i + 1 < lineWithoutComment.length && lineWithoutComment[i + 1] === ' ') {
      // This is an escaped space
      currentToken += ' ';
      i++; // Skip the next character (the space)
      continue;
    }
    
    if (/\s/.test(char)) {
      // This is unescaped whitespace
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
    } else {
      currentToken += char;
    }
  }
  
  // Add the last token if there is one
  if (currentToken) {
    tokens.push(currentToken);
  }
  
  if (tokens.length < 2) {
    // Need at least a path and one owner
    return null;
  }
  
  // First token is the path, rest are owners (no validation needed)
  const path = tokens[0];
  const owners = tokens.slice(1);
  
  // Basic validation - path and owners should not be empty
  if (!path || owners.length === 0) {
    return null;
  }

  return { path, owners };
}
