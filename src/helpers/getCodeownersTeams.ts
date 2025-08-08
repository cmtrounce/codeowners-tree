import * as fs from "fs";
import { parseCodeownersLine } from "./parseCodeownersLine";

export function getCodeownersTeams(codeownersPath: string) {
  const codeowners = fs.readFileSync(codeownersPath, "utf-8");

  const teams = new Set<string>();

  codeowners.split("\n").forEach((line) => {
    const parsed = parseCodeownersLine(line);
    
    if (parsed) {
      parsed.owners.forEach((owner) => {
        teams.add(owner);
      });
    }
  });

  return teams;
}
