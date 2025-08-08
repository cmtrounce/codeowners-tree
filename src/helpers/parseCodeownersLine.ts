/**
 * Parses a single line from a CODEOWNERS file, properly handling quoted paths and spaces.
 * 
 * @param line - The raw line from the CODEOWNERS file
 * @returns Object containing the path and array of owners, or null if line is empty/comment only
 */
export function parseCodeownersLine(line: string): { path: string; owners: string[] } | null {
  // Step 1: Remove comments
  let lineWithoutComment = line;
  
  // Check if entire line is a comment (starts with #)
  if (line.trim().startsWith('#')) {
    return null;
  }
  
      // Check for inline comments (# preceded by whitespace or at end of line)
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '#' && i > 0 && (line[i-1] === ' ' || line[i-1] === '\t')) {
        lineWithoutComment = line.substring(0, i).trimEnd();
        break;
      }
    }

  // Step 2: Check if line is empty after comment removal
  if (!lineWithoutComment || lineWithoutComment.trim() === '') {
    return null;
  }

  // Step 3: Find the path (first part before owners)
  let path = '';
  let owners: string[] = [];
  
  // If the line starts with a quote, find the quoted path
  if (lineWithoutComment.startsWith('"')) {
    const endQuoteIndex = lineWithoutComment.indexOf('"', 1);
    if (endQuoteIndex === -1) {
      // Malformed quoted path
      return null;
    }
    
    path = lineWithoutComment.substring(1, endQuoteIndex);
    const remainingLine = lineWithoutComment.substring(endQuoteIndex + 1).trim();
    
    // Parse owners from the remaining line
    if (remainingLine) {
      owners = remainingLine.split(/\s+/).filter(owner => owner.startsWith('@'));
    }
      } else {
      // Simple case: split by whitespace
      const parts = lineWithoutComment.split(/\s+/);
      
      if (parts.length === 0) {
        return null;
      }
      
      // First part is the path
      path = parts[0];
      
      // Remaining parts are owners (including non-@ prefixed parts)
      for (let i = 1; i < parts.length; i++) {
        owners.push(parts[i]);
      }
    }

  // Step 4: Validate we have both a path and at least one owner
  if (!path || path.trim() === '' || owners.length === 0) {
    return null;
  }

  return { path, owners };
}
