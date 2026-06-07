import type {
  AIEvaluation,
  ApiResponse,
  AuthSession,
  CreateCommentRequest,
  CreateIdeaRequest,
  IdeaCard,
  IdeaComment,
  IdeaDetail,
  LoginRequest,
  PointSummary,
  UpdateWhiteboardRequest,
  Whiteboard,
  WhiteboardAssistantMessage,
  WhiteboardAssistantRequest,
  WhiteboardAssistantResponse
} from "@ideaflow/shared/types";
import { createHttpClient } from "./httpClient";
import { createMockClient } from "./mockClient";

export interface IdeaFlowClient {
  getStoredSession(): AuthSession | null;
  logout(): void;
  login(input: LoginRequest): Promise<ApiResponse<AuthSession>>;
  listIdeas(input?: { tab?: "recommended" | "latest" | "following"; cursor?: string }): Promise<ApiResponse<IdeaCard[]>>;
  getIdea(id: string): Promise<ApiResponse<IdeaDetail>>;
  createIdea(input: CreateIdeaRequest): Promise<ApiResponse<IdeaDetail>>;
  unlockIdea(id: string): Promise<ApiResponse<IdeaDetail>>;
  likeIdea(id: string): Promise<ApiResponse<IdeaCard>>;
  listComments(id: string): Promise<ApiResponse<IdeaComment[]>>;
  createComment(id: string, input: CreateCommentRequest): Promise<ApiResponse<IdeaComment>>;
  getWhiteboard(id: string): Promise<ApiResponse<Whiteboard>>;
  updateWhiteboard(id: string, input: UpdateWhiteboardRequest): Promise<ApiResponse<Whiteboard>>;
  getWhiteboardAssistantMessages(id: string): Promise<ApiResponse<WhiteboardAssistantMessage[]>>;
  askWhiteboardAssistant(id: string, input: WhiteboardAssistantRequest): Promise<ApiResponse<WhiteboardAssistantResponse>>;
  getEvaluation(id: string): Promise<ApiResponse<AIEvaluation | null>>;
  evaluateIdea(id: string): Promise<ApiResponse<AIEvaluation>>;
  getPoints(): Promise<ApiResponse<PointSummary>>;
}

export function createIdeaFlowClient(): IdeaFlowClient {
  return process.env.NEXT_PUBLIC_API_MODE === "api" ? createHttpClient() : createMockClient();
}
