/**
 * Parses a single line from a CODEOWNERS file.
 */
export function parseCodeownersLine(line: string): { path: string; owners: string[] } | null {
  let lineWithoutComment = line;
  
  if (line.trim().startsWith('#')) {
    return null;
  }
  
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '#' && i > 0 && (line[i-1] === ' ' || line[i-1] === '\t')) {
      lineWithoutComment = line.substring(0, i).trimEnd();
      break;
    }
  }

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
    return null;
  }

  const path = tokens[0];
  const owners = tokens.slice(1);

  const cleanOwners = owners.map(owner => {
    const hashIndex = owner.indexOf('#');
    return hashIndex !== -1 ? owner.substring(0, hashIndex) : owner;
  }).filter(owner => owner.length > 0);

  if (!path || cleanOwners.length === 0) {
    return null;
  }

  return { path, owners: cleanOwners };
}
