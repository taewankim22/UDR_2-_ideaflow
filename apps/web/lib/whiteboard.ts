import {
  WHITEBOARD_NODE_DEFINITIONS,
  type Whiteboard,
  type WhiteboardNode,
  type WhiteboardNodeKey
} from "@ideaflow/shared/types";
import { nodeTheme } from "./uiConfig";

export function getBoardNode(board: Whiteboard, key: WhiteboardNodeKey): WhiteboardNode {
  return (
    board.nodes.find((node) => node.key === key) ?? {
      key,
      label: nodeTheme[key].label,
      content: ""
    }
  );
}

export function makeEmptyBoard(ideaId: string): Whiteboard {
  return {
    ideaId,
    updatedAt: new Date().toISOString(),
    nodes: WHITEBOARD_NODE_DEFINITIONS.map((node) => ({
      ...node,
      label: nodeTheme[node.key].label,
      content: ""
    }))
  };
}

export function updateBoardNode(
  board: Whiteboard,
  key: WhiteboardNodeKey,
  content: string
): Whiteboard {
  return {
    ...board,
    nodes: WHITEBOARD_NODE_DEFINITIONS.map((definition) => {
      const existing = getBoardNode(board, definition.key);
      return definition.key === key
        ? { ...existing, label: nodeTheme[key].label, content }
        : { ...existing, label: nodeTheme[definition.key].label };
    })
  };
}
