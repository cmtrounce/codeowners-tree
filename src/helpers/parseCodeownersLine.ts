/**
 * Parses a single line from a CODEOWNERS file, properly handling escaped spaces and quoted paths.
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

  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let escaped = false;
  
  for (let i = 0; i < lineWithoutComment.length; i++) {
    const char = lineWithoutComment[i];
    
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    
    if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      continue;
    }
    
    current += char;
  }
  
  if (current.trim()) {
    tokens.push(current.trim());
  }

  if (tokens.length < 2) {
    return null; // Need at least a path and one owner
  }

  const path = tokens[0];
  const owners = tokens.slice(1);

  // Handle inline comments in owners (e.g., @team2#comment)
  const cleanOwners = owners.map(owner => {
    const hashIndex = owner.indexOf('#');
    return hashIndex !== -1 ? owner.substring(0, hashIndex) : owner;
  }).filter(owner => owner.length > 0);

  // Basic validation
  if (!path || cleanOwners.length === 0) {
    return null;
  }

  return { path, owners: cleanOwners };
}
