import type {
  AIEvaluation,
  ApiResponse,
  AuthSession,
  CreateCommentRequest,
  CreateIdeaRequest,
  ErrorCode,
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

function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

function fallbackMessage(status: number, code: ErrorCode) {
  if (status === 401) return "로그인이 만료되었습니다. 다시 로그인해 주세요.";
  if (status === 402) return "포인트가 부족합니다. 포인트 잔액을 확인해 주세요.";
  if (status === 503) return "AI 평가가 잠시 실패했습니다. 잠시 후 다시 시도해 주세요.";
  return "요청을 처리하지 못했습니다.";
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
    const result = (await response.json()) as ApiResponse<T>;

    if (!response.ok && result.success === false) {
      if (response.status === 401) {
        clearSession();
      }
      return {
        success: false,
        error: {
          code: result.error.code,
          message: result.error.message || fallbackMessage(response.status, result.error.code)
        }
      };
    }

    if (response.status === 401) {
      clearSession();
    }

    return result;
  } catch {
    return {
      success: false,
      error: {
        code: "AI_UNAVAILABLE",
        message: "API 서버에 연결할 수 없습니다. mock 모드 또는 baseURL을 확인해 주세요."
      }
    };
  }
}

function withQuery(path: string, query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const suffix = params.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function createHttpClient(): IdeaFlowClient {
  return {
    getStoredSession,
    logout: clearSession,
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
    listIdeas: (input) => request<IdeaCard[]>(withQuery("/ideas", input ?? {})),
    getIdea: (id) => request<IdeaDetail>(`/ideas/${id}`),
    createIdea: (input) => request<IdeaDetail>("/ideas", { method: "POST", body: JSON.stringify(input) }),
    unlockIdea: (id) => request<IdeaDetail>(`/ideas/${id}/unlock`, { method: "POST" }),
    likeIdea: (id) => request<IdeaCard>(`/ideas/${id}/like`, { method: "POST" }),
    listComments: (id) => request<IdeaComment[]>(`/ideas/${id}/comments`),
    createComment: (id, input: CreateCommentRequest) =>
      request<IdeaComment>(`/ideas/${id}/comments`, {
        method: "POST",
        body: JSON.stringify(input)
      }),
    getWhiteboard: (id) => request<Whiteboard>(`/ideas/${id}/whiteboard`),
    updateWhiteboard: (id, input: UpdateWhiteboardRequest) =>
      request<Whiteboard>(`/ideas/${id}/whiteboard`, {
        method: "PUT",
        body: JSON.stringify(input)
      }),
    getWhiteboardAssistantMessages: (id) => request<WhiteboardAssistantMessage[]>(`/ideas/${id}/whiteboard/assistant/messages`),
    askWhiteboardAssistant: (id, input: WhiteboardAssistantRequest) =>
      request<WhiteboardAssistantResponse>(`/ideas/${id}/whiteboard/assistant`, {
        method: "POST",
        body: JSON.stringify(input)
      }),
    getEvaluation: (id) => request<AIEvaluation | null>(`/ideas/${id}/ai/evaluation`),
    evaluateIdea: (id) => request<AIEvaluation>(`/ideas/${id}/ai/evaluate`, { method: "POST" }),
    getPoints: () => request<PointSummary>("/points")
  };
}
