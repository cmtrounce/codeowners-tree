import TreeNode from "./TreeNode";
import { parseCodeownersLine } from "../helpers/parseCodeownersLine";

export function addCodeownersNodes(line: string, team: string, root: TreeNode) {
  const parsed = parseCodeownersLine(line);
  
  if (!parsed || !parsed.owners.includes(team)) {
    return;
  }

  const pathParts = parsed.path.split("/");
  let currentNode = root;
  let fullPath = "";

  pathParts.forEach((part, index) => {
    fullPath += `/${part}`;

    const isCodeownersLeaf =
      index === pathParts.length - 1 || pathParts[index + 1] === "";

    if (part !== "") {
      if (!currentNode.children[fullPath]) {
        currentNode.children[fullPath] = new TreeNode(
          fullPath,
          isCodeownersLeaf
        );
      }
      currentNode = currentNode.children[fullPath];
    }
  });
}
