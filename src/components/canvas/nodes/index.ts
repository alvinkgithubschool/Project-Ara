import type { NodeTypes } from "@xyflow/react";
import { NoteNode } from "./NoteNode";
import { FileNode } from "./FileNode";
import { ClusterNode } from "./ClusterNode";

export const nodeTypes: NodeTypes = {
  note: NoteNode,
  file: FileNode,
  cluster: ClusterNode,
  // Future: media, operator, folder, project
};

export { NoteNode, FileNode, ClusterNode };
