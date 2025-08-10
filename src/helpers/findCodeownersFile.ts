import * as fs from "fs";
import * as path from "path";

export function findCodeownersFile(workspaceRoot: string): string | undefined {
  const possiblePaths = [
    path.join(workspaceRoot, "CODEOWNERS"),
    path.join(workspaceRoot, ".github", "CODEOWNERS"),
    path.join(workspaceRoot, "docs", "CODEOWNERS")
  ];

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }

  return undefined;
}
