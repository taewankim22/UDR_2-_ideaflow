import {
  WHITEBOARD_NODE_DEFINITIONS,
  type Whiteboard,
  type WhiteboardEdge,
  type WhiteboardNode,
  type WhiteboardNodeKey,
  type WhiteboardViewport
} from "@ideaflow/shared/types";
import { nodeTheme } from "./uiConfig";

const defaultPositions: Record<WhiteboardNodeKey, { x: number; y: number }> = {
  problemContext: { x: 80, y: 80 },
  targetUser: { x: 80, y: 290 },
  currentAlternatives: { x: 80, y: 500 },
  solutionConcept: { x: 390, y: 80 },
  coreValue: { x: 390, y: 290 },
  revenueModel: { x: 700, y: 290 },
  validationPlan: { x: 390, y: 500 }
};

export const defaultViewport: WhiteboardViewport = { x: 0, y: 0, zoom: 1 };
export const defaultEdges: WhiteboardEdge[] = [
  { id: "edge-problem-solution", source: "core-problemContext", target: "core-solutionConcept" },
  { id: "edge-target-value", source: "core-targetUser", target: "core-coreValue" },
  { id: "edge-solution-value", source: "core-solutionConcept", target: "core-coreValue" },
  { id: "edge-value-mvp", source: "core-coreValue", target: "core-validationPlan" }
];

export function createCoreNode(key: WhiteboardNodeKey, content = ""): WhiteboardNode {
  const definition = WHITEBOARD_NODE_DEFINITIONS.find((node) => node.key === key);
  const label = nodeTheme[key]?.label ?? definition?.label ?? key;

  return {
    id: `core-${key}`,
    type: "core",
    key,
    label,
    title: label,
    content,
    position: defaultPositions[key],
    size: { width: 240, height: 150 },
    locked: true
  };
}

export function getBoardNode(board: Whiteboard, key: WhiteboardNodeKey): WhiteboardNode {
  return board.nodes.find((node) => node.key === key) ?? createCoreNode(key);
}

const coreNodeKeys = new Set<WhiteboardNodeKey>(WHITEBOARD_NODE_DEFINITIONS.map((node) => node.key));

function withCanvasDefaults(board: Whiteboard): Pick<Whiteboard, "edges" | "viewport"> {
  return {
    edges: board.edges ?? defaultEdges,
    viewport: board.viewport ?? defaultViewport
  };
}

export function makeEmptyBoard(ideaId: string): Whiteboard {
  return {
    ideaId,
    updatedAt: new Date().toISOString(),
    nodes: WHITEBOARD_NODE_DEFINITIONS.map((node) => createCoreNode(node.key)),
    edges: defaultEdges,
    viewport: defaultViewport
  };
}

export function updateBoardNode(
  board: Whiteboard,
  key: WhiteboardNodeKey,
  content: string
): Whiteboard {
  const extraNodes = board.nodes.filter((node) => !node.key || !coreNodeKeys.has(node.key));

  return {
    ...board,
    nodes: WHITEBOARD_NODE_DEFINITIONS.map((definition) => {
      const existing = getBoardNode(board, definition.key);
      return definition.key === key
        ? { ...existing, label: nodeTheme[key].label, title: nodeTheme[key].label, content }
        : { ...existing, label: nodeTheme[definition.key].label, title: nodeTheme[definition.key].label };
    }).concat(extraNodes),
    ...withCanvasDefaults(board)
  };
}

export function updateBoardNodeContent(board: Whiteboard, nodeId: string, content: string): Whiteboard {
  const node = board.nodes.find((item) => item.id === nodeId);
  if (node?.key) {
    return updateBoardNode(board, node.key, content);
  }

  return {
    ...board,
    nodes: board.nodes.map((item) => (item.id === nodeId ? { ...item, content } : item)),
    ...withCanvasDefaults(board)
  };
}

export function updateBoardNodePosition(
  board: Whiteboard,
  nodeId: string,
  position: { x: number; y: number }
): Whiteboard {
  return {
    ...board,
    nodes: board.nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            position: {
              x: Math.round(position.x),
              y: Math.round(position.y)
            }
          }
        : node
    ),
    ...withCanvasDefaults(board)
  };
}

export function updateBoardViewport(board: Whiteboard, viewport: WhiteboardViewport): Whiteboard {
  return {
    ...board,
    ...withCanvasDefaults(board),
    viewport
  };
}
