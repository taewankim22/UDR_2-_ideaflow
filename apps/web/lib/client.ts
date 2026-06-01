import type {
  AIEvaluation,
  ApiResponse,
  AuthSession,
  CreateIdeaRequest,
  IdeaCard,
  IdeaDetail,
  LoginRequest,
  PointSummary,
  UpdateWhiteboardRequest,
  Whiteboard
} from "@ideaflow/shared/types";
import { createHttpClient } from "./httpClient";
import { createMockClient } from "./mockClient";

export interface IdeaFlowClient {
  getStoredSession(): AuthSession | null;
  logout(): void;
  login(input: LoginRequest): Promise<ApiResponse<AuthSession>>;
  listIdeas(): Promise<ApiResponse<IdeaCard[]>>;
  getIdea(id: string): Promise<ApiResponse<IdeaDetail>>;
  createIdea(input: CreateIdeaRequest): Promise<ApiResponse<IdeaDetail>>;
  unlockIdea(id: string): Promise<ApiResponse<IdeaDetail>>;
  getWhiteboard(id: string): Promise<ApiResponse<Whiteboard>>;
  updateWhiteboard(id: string, input: UpdateWhiteboardRequest): Promise<ApiResponse<Whiteboard>>;
  getEvaluation(id: string): Promise<ApiResponse<AIEvaluation | null>>;
  evaluateIdea(id: string): Promise<ApiResponse<AIEvaluation>>;
  getPoints(): Promise<ApiResponse<PointSummary>>;
}

export function createIdeaFlowClient(): IdeaFlowClient {
  return process.env.NEXT_PUBLIC_API_MODE === "api" ? createHttpClient() : createMockClient();
}
