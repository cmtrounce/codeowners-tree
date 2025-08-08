import * as fs from "fs";
import * as readline from "readline";
import { digraph } from "graphviz";
import * as path from "path";
import { compactTree } from "./compactTree";
import { convertTreeToGraph } from "./convertTreeToGraph";
import { addCodeownersNodes } from "./addCodeownersNodes";
import TreeNode from "./TreeNode";
import { findCodeownersFile } from "../helpers/findCodeownersFile";

export function generateGraph({
  workspaceRoot,
  team,
  addLinks,
  onFinish,
}: {
  workspaceRoot: string;
  team: string;
  addLinks: boolean;
  onFinish: (path: string) => void;
}) {
  const codeownersPath = findCodeownersFile(workspaceRoot);
  
  if (!codeownersPath) {
    onFinish("Error: No CODEOWNERS file found");
    return;
  }

  const readStream = readline.createInterface({
    input: fs.createReadStream(codeownersPath),
  });

  const root = new TreeNode(team, false, true);

  readStream.on("line", (line: string) => {
    addCodeownersNodes(line, team, root);
  });

  readStream.on("close", () => {
    const compactedTree = compactTree(root);

    const graph = digraph("CodeOwners");
    graph.set("rankdir", "LR");
    convertTreeToGraph(graph, compactedTree, null, addLinks);
    graph.render("svg", (data) => {
      onFinish(data.toString());
    });
  });
}
