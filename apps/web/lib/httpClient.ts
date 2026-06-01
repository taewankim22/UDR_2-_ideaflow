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
import type { IdeaFlowClient } from "./client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";
const SESSION_KEY = "ideaflow.session";

function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

function storeSession(session: AuthSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const session = getStoredSession();
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
        ...(init.headers ?? {})
      }
    });
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: {
        code: "AI_UNAVAILABLE",
        message: "API 서버에 연결할 수 없습니다."
      }
    };
  }
}

export function createHttpClient(): IdeaFlowClient {
  return {
    getStoredSession,
    logout() {
      window.localStorage.removeItem(SESSION_KEY);
    },
    async login(input: LoginRequest) {
      const result = await request<AuthSession>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input)
      });
      if (result.success) {
        storeSession(result.data);
      }
      return result;
    },
    listIdeas: () => request<IdeaCard[]>("/ideas"),
    getIdea: (id) => request<IdeaDetail>(`/ideas/${id}`),
    createIdea: (input) => request<IdeaDetail>("/ideas", { method: "POST", body: JSON.stringify(input) }),
    unlockIdea: (id) => request<IdeaDetail>(`/ideas/${id}/unlock`, { method: "POST" }),
    getWhiteboard: (id) => request<Whiteboard>(`/ideas/${id}/whiteboard`),
    updateWhiteboard: (id, input: UpdateWhiteboardRequest) =>
      request<Whiteboard>(`/ideas/${id}/whiteboard`, {
        method: "PUT",
        body: JSON.stringify(input)
      }),
    getEvaluation: (id) => request<AIEvaluation | null>(`/ideas/${id}/ai/evaluation`),
    evaluateIdea: (id) => request<AIEvaluation>(`/ideas/${id}/ai/evaluate`, { method: "POST" }),
    getPoints: () => request<PointSummary>("/points")
  };
}
