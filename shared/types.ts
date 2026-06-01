export type ApiResponse<T> =
  | { success: true; data: T; meta?: { nextCursor?: string } }
  | { success: false; error: { code: ErrorCode; message: string } };

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INSUFFICIENT_POINTS"
  | "NOT_FOUND"
  | "CONFLICT"
  | "AI_UNAVAILABLE";

export type Category = "AI" | "EDU" | "TRAVEL" | "ENV" | "HEALTH" | "ETC";
export type Provider = "email" | "kakao" | "google";

export const CATEGORIES = ["AI", "EDU", "TRAVEL", "ENV", "HEALTH", "ETC"] as const;
export const PROVIDERS = ["email", "kakao", "google"] as const;

export interface User {
  id: string;
  email: string;
  username: string;
  profileImageUrl: string | null;
  pointsBalance: number;
}

export interface IdeaCard {
  id: string;
  title: string;
  oneLine: string;
  category: Category;
  coverImageUrl: string | null;
  authorName: string;
  likeCount: number;
  commentCount: number;
  unlockCost: number;
  isUnlocked: boolean;
  createdAt: string;
}

export interface IdeaDetail extends IdeaCard {
  problem: string;
  solution: string;
}

export type WhiteboardNodeKey =
  | "problemContext"
  | "targetUser"
  | "currentAlternatives"
  | "solutionConcept"
  | "coreValue"
  | "revenueModel"
  | "validationPlan";

export interface WhiteboardNode {
  key: WhiteboardNodeKey;
  label: string;
  content: string;
}

export const WHITEBOARD_NODE_KEYS = [
  "problemContext",
  "targetUser",
  "currentAlternatives",
  "solutionConcept",
  "coreValue",
  "revenueModel",
  "validationPlan"
] as const;

export const WHITEBOARD_NODE_DEFINITIONS: ReadonlyArray<Pick<WhiteboardNode, "key" | "label">> = [
  { key: "problemContext", label: "문제" },
  { key: "targetUser", label: "타겟 사용자" },
  { key: "currentAlternatives", label: "리스크" },
  { key: "solutionConcept", label: "해결 방법" },
  { key: "coreValue", label: "핵심 기능" },
  { key: "revenueModel", label: "수익 모델" },
  { key: "validationPlan", label: "MVP" }
];

export interface Whiteboard {
  ideaId: string;
  updatedAt: string;
  nodes: WhiteboardNode[];
}

export interface AIEvaluation {
  ideaId: string;
  overallScore: number;
  scores: {
    market: number;
    feasibility: number;
    profitability: number;
    differentiation: number;
    growth: number;
  };
  summary: string;
  suggestions: string[];
  createdAt: string;
}

export type PointAction = "SIGNUP_BONUS" | "IDEA_CREATE" | "IDEA_UNLOCK" | "AI_EVALUATE";

export interface PointRule {
  action: PointAction;
  delta: number;
  label: string;
}

export interface PointLedgerEntry {
  id: string;
  action: PointAction;
  delta: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}

export interface PointSummary {
  user: User;
  rules: PointRule[];
  transactions: PointLedgerEntry[];
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  username?: string;
  provider?: Provider;
}

export interface CreateIdeaRequest {
  title: string;
  oneLine: string;
  problem: string;
  solution: string;
  category: Category;
  coverImageUrl?: string | null;
}

export interface UpdateWhiteboardRequest {
  nodes: WhiteboardNode[];
}
