import * as fs from "fs";
import * as path from "path";
import { findCodeownersFile } from "./findCodeownersFile";
import { findBestMatch } from "./pathMatcher";

export interface CoverageAnalysis {
  totalFiles: number;
  coveredFiles: number;
  coveragePercentage: number;
  uncoveredDirectories: DirectoryCoverage[];
  fileTypeCoverage: FileTypeCoverage[];
  teamCoverage: TeamCoverage[];
  scanDate: Date;
}

export interface DirectoryCoverage {
  path: string;
  totalFiles: number;
  coveredFiles: number;
  uncoveredFiles: number;
  coveragePercentage: number;
}

export interface FileTypeCoverage {
  extension: string;
  totalFiles: number;
  coveredFiles: number;
  uncoveredFiles: number;
  coveragePercentage: number;
}

export interface TeamCoverage {
  team: string;
  totalFiles: number;
  percentageOfTotal: number;
}

export interface FileCoverage {
  path: string;
  isCovered: boolean;
  owners: string[];
}

/**
 * Analyzes CODEOWNERS coverage for the entire workspace
 */
export function analyzeCoverage(workspaceRoot: string): CoverageAnalysis {
  const codeownersPath = findCodeownersFile(workspaceRoot);
  if (!codeownersPath) {
    throw new Error("No CODEOWNERS file found in workspace");
  }

  // Read CODEOWNERS content
  const codeownersContent = fs.readFileSync(codeownersPath, "utf-8");

  // Get all files in workspace
  const allFiles = getAllFiles(workspaceRoot);
  
  // Analyze coverage for each file
  const fileCoverages: FileCoverage[] = allFiles.map(filePath => {
    const relativePath = path.relative(workspaceRoot, filePath);
    const normalizedPath = relativePath.replace(/\\/g, '/');
    const bestMatch = findBestMatch(normalizedPath, codeownersContent);
    
    return {
      path: normalizedPath,
      isCovered: bestMatch !== null,
      owners: bestMatch ? bestMatch.owners : []
    };
  });

  // Calculate overall coverage
  const coveredFiles = fileCoverages.filter(f => f.isCovered).length;
  const totalFiles = fileCoverages.length;
  const coveragePercentage = totalFiles > 0 ? (coveredFiles / totalFiles) * 100 : 0;

  // Analyze by directory
  const uncoveredDirectories = analyzeDirectoryCoverage(fileCoverages);

  // Analyze by file type
  const fileTypeCoverage = analyzeFileTypeCoverage(fileCoverages);

  // Analyze by team
  const teamCoverage = analyzeTeamCoverage(fileCoverages);

  return {
    totalFiles,
    coveredFiles,
    coveragePercentage,
    uncoveredDirectories,
    fileTypeCoverage,
    teamCoverage,
    scanDate: new Date()
  };
}

/**
 * Gets all files in the workspace recursively, respecting .gitignore patterns
 */
function getAllFiles(dir: string): string[] {
  // Try to read .gitignore patterns
  const gitignorePath = path.join(dir, '.gitignore');
  const gitignorePatterns = fs.existsSync(gitignorePath) ? parseGitignore(gitignorePath) : [];
  
  return getAllFilesRecursive(dir, gitignorePatterns, dir);
}

function getAllFilesRecursive(dir: string, gitignorePatterns: string[] = [], workspaceRoot: string): string[] {
  const files: string[] = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.relative(workspaceRoot, fullPath).replace(/\\/g, '/');
      
      // Skip if matches gitignore pattern
      if (gitignorePatterns.length > 0 && matchesGitignorePattern(relativePath, gitignorePatterns)) {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (shouldSkipDirectory(item)) {
          continue;
        }
        files.push(...getAllFilesRecursive(fullPath, gitignorePatterns, workspaceRoot));
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * Parses .gitignore file and returns array of patterns
 */
function parseGitignore(gitignorePath: string): string[] {
  try {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.replace(/\/$/, '')); // Remove trailing slash
  } catch (error) {
    return [];
  }
}

/**
 * Checks if a file path matches any gitignore pattern
 */
function matchesGitignorePattern(filePath: string, patterns: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  for (const pattern of patterns) {
    if (!pattern) {
      continue;
    }
    
    // Handle different pattern types
    if (pattern.startsWith('!')) {
      // Negation pattern - skip for now
      continue;
    }
    
    if (pattern.includes('*')) {
      // Wildcard pattern
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(normalizedPath)) {
        return true;
      }
      // Also check if the pattern matches the filename part
      const fileName = path.basename(normalizedPath);
      const fileNameRegex = new RegExp(`^${regexPattern}$`);
      if (fileNameRegex.test(fileName)) {
        return true;
      }
    } else if (pattern.startsWith('/')) {
      // Absolute pattern from root
      if (normalizedPath.startsWith(pattern.slice(1))) {
        return true;
      }
    } else if (pattern.endsWith('/')) {
      // Directory pattern
      const dirPattern = pattern.slice(0, -1);
      if (normalizedPath.startsWith(dirPattern + '/') || normalizedPath === dirPattern) {
        return true;
      }
    } else {
      // Simple file/directory pattern
      if (normalizedPath === pattern || normalizedPath.endsWith('/' + pattern)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Determines if a directory should be skipped in coverage analysis
 */
function shouldSkipDirectory(dirName: string): boolean {
  const skipDirs = [
    'node_modules',
    '.git',
    '.vscode',
    'dist',
    'build',
    'out',
    'coverage',
    '.nyc_output',
    '.next',
    '.nuxt',
    'target',
    'bin',
    'obj'
  ];
  
  return skipDirs.includes(dirName);
}

/**
 * Analyzes coverage by directory
 */
function analyzeDirectoryCoverage(fileCoverages: FileCoverage[]): DirectoryCoverage[] {
  const directoryMap = new Map<string, { covered: number; total: number }>();
  
  for (const file of fileCoverages) {
    const dirPath = path.dirname(file.path);
    const current = directoryMap.get(dirPath) || { covered: 0, total: 0 };
    
    current.total++;
    if (file.isCovered) {
      current.covered++;
    }
    
    directoryMap.set(dirPath, current);
  }
  
  return Array.from(directoryMap.entries())
    .map(([dirPath, stats]) => ({
      path: dirPath,
      totalFiles: stats.total,
      coveredFiles: stats.covered,
      uncoveredFiles: stats.total - stats.covered,
      coveragePercentage: stats.total > 0 ? (stats.covered / stats.total) * 100 : 0
    }))
    .filter(dir => dir.totalFiles > 0) // Only include directories with files
    .sort((a, b) => b.uncoveredFiles - a.uncoveredFiles) // Sort by most uncovered first
    .slice(0, 10); // Top 10 directories
}

/**
 * Analyzes coverage by file type
 */
function analyzeFileTypeCoverage(fileCoverages: FileCoverage[]): FileTypeCoverage[] {
  const typeMap = new Map<string, { covered: number; total: number }>();
  
  for (const file of fileCoverages) {
    const extension = path.extname(file.path) || '(no extension)';
    const current = typeMap.get(extension) || { covered: 0, total: 0 };
    
    current.total++;
    if (file.isCovered) {
      current.covered++;
    }
    
    typeMap.set(extension, current);
  }
  
  return Array.from(typeMap.entries())
    .map(([extension, stats]) => ({
      extension,
      totalFiles: stats.total,
      coveredFiles: stats.covered,
      uncoveredFiles: stats.total - stats.covered,
      coveragePercentage: stats.total > 0 ? (stats.covered / stats.total) * 100 : 0
    }))
    .filter(type => type.totalFiles >= 5) // Only include file types with 5+ files
    .sort((a, b) => b.totalFiles - a.totalFiles); // Sort by most common first
}

/**
 * Analyzes coverage by team
 */
function analyzeTeamCoverage(fileCoverages: FileCoverage[]): TeamCoverage[] {
  const teamMap = new Map<string, number>();
  const totalFiles = fileCoverages.length;
  
  for (const file of fileCoverages) {
    for (const owner of file.owners) {
      const current = teamMap.get(owner) || 0;
      teamMap.set(owner, current + 1);
    }
  }
  
  return Array.from(teamMap.entries())
    .map(([team, fileCount]) => ({
      team,
      totalFiles: fileCount,
      percentageOfTotal: totalFiles > 0 ? (fileCount / totalFiles) * 100 : 0
    }))
    .sort((a, b) => b.totalFiles - a.totalFiles); // Sort by most files first
}
