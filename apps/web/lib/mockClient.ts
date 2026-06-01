import {
  WHITEBOARD_NODE_DEFINITIONS,
  type AIEvaluation,
  type ApiResponse,
  type AuthSession,
  type Category,
  type CreateIdeaRequest,
  type ErrorCode,
  type IdeaCard,
  type IdeaDetail,
  type LoginRequest,
  type PointAction,
  type PointLedgerEntry,
  type PointRule,
  type PointSummary,
  type UpdateWhiteboardRequest,
  type User,
  type Whiteboard
} from "@ideaflow/shared/types";
import type { IdeaFlowClient } from "./client";

const STATE_KEY = "ideaflow.mock-state.v2";
const TOKEN = "mock-token";

const pointRules: PointRule[] = [
  { action: "SIGNUP_BONUS", delta: 30, label: "가입 보너스" },
  { action: "IDEA_CREATE", delta: 10, label: "아이디어 작성" },
  { action: "IDEA_UNLOCK", delta: -3, label: "아이디어 잠금 해제" },
  { action: "AI_EVALUATE", delta: -5, label: "AI 평가" }
];

type MockIdea = IdeaDetail & {
  authorId: string;
  unlockedBy: string[];
};

type MockTransaction = PointLedgerEntry & {
  userId: string;
};

interface MockState {
  session: AuthSession | null;
  users: User[];
  ideas: MockIdea[];
  whiteboards: Whiteboard[];
  evaluations: AIEvaluation[];
  transactions: MockTransaction[];
}

function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

function fail<T>(code: ErrorCode, message: string): ApiResponse<T> {
  return { success: false, error: { code, message } };
}

function now(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

function defaultWhiteboard(ideaId: string): Whiteboard {
  return {
    ideaId,
    updatedAt: now(),
    nodes: WHITEBOARD_NODE_DEFINITIONS.map((node) => ({ ...node, content: "" }))
  };
}

function createInitialState(): MockState {
  return {
    session: null,
    users: [
      {
        id: "seed-user-1",
        email: "mina@example.com",
        username: "Mina",
        profileImageUrl: null,
        pointsBalance: 30
      },
      {
        id: "seed-user-2",
        email: "joon@example.com",
        username: "Joon",
        profileImageUrl: null,
        pointsBalance: 30
      }
    ],
    ideas: [
      {
        id: "idea-travel-planner",
        authorId: "seed-user-1",
        title: "AI 여행 일정 플래너",
        oneLine: "취향과 예산에 맞는 여행 일정을 자동으로 추천하는 서비스",
        category: "TRAVEL",
        coverImageUrl: null,
        authorName: "Mina",
        likeCount: 12,
        commentCount: 4,
        unlockCost: 3,
        isUnlocked: false,
        createdAt: now(-210),
        problem: "여행자가 여러 사이트를 오가며 항공, 숙소, 동선을 직접 비교해야 해서 일정 계획 시간이 오래 걸립니다.",
        solution: "사용자의 취향, 예산, 기간을 입력하면 최적의 일정과 이동 동선을 자동으로 제안합니다.",
        unlockedBy: []
      },
      {
        id: "idea-presentation-coach",
        authorId: "seed-user-2",
        title: "AI 발표 코치",
        oneLine: "발표 영상을 분석해 속도, 시선 처리, 논리 흐름을 피드백하는 서비스",
        category: "AI",
        coverImageUrl: null,
        authorName: "Joon",
        likeCount: 8,
        commentCount: 2,
        unlockCost: 3,
        isUnlocked: false,
        createdAt: now(-90),
        problem: "발표 연습 후 객관적인 피드백을 받기 어렵고, 개선해야 할 지점을 스스로 찾기 힘듭니다.",
        solution: "영상과 음성을 분석해 말의 속도, 멈춤, 시선, 발표 구조를 점수화하고 개선 가이드를 제공합니다.",
        unlockedBy: []
      }
    ],
    whiteboards: [defaultWhiteboard("idea-travel-planner"), defaultWhiteboard("idea-presentation-coach")],
    evaluations: [],
    transactions: []
  };
}

function readState(): MockState {
  if (typeof window === "undefined") {
    return createInitialState();
  }
  const raw = window.localStorage.getItem(STATE_KEY);
  if (!raw) {
    const state = createInitialState();
    writeState(state);
    return state;
  }
  return JSON.parse(raw) as MockState;
}

function writeState(state: MockState) {
  window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function currentSession(state: MockState) {
  if (!state.session) {
    throw new Error("UNAUTHORIZED");
  }
  return state.session;
}

function asCard(idea: MockIdea, userId: string | null): IdeaCard {
  return {
    id: idea.id,
    title: idea.title,
    oneLine: idea.oneLine,
    category: idea.category,
    coverImageUrl: idea.coverImageUrl,
    authorName: idea.authorName,
    likeCount: idea.likeCount,
    commentCount: idea.commentCount,
    unlockCost: idea.unlockCost,
    isUnlocked: idea.authorId === userId || idea.unlockedBy.includes(userId ?? ""),
    createdAt: idea.createdAt
  };
}

function asDetail(idea: MockIdea, userId: string | null): IdeaDetail {
  const card = asCard(idea, userId);
  return {
    ...card,
    problem: card.isUnlocked ? idea.problem : "",
    solution: card.isUnlocked ? idea.solution : ""
  };
}

function createUser(input: LoginRequest): User {
  const email = input.email.toLowerCase();
  return {
    id: `mock-user-${email}`,
    email,
    username: input.username?.trim() || email.split("@")[0] || "Idea Maker",
    profileImageUrl: null,
    pointsBalance: 30
  };
}

function pushTransaction(
  state: MockState,
  userId: string,
  action: PointAction,
  delta: number,
  balanceAfter: number,
  reason: string
) {
  state.transactions.unshift({
    id: `tx-${Date.now()}-${state.transactions.length}`,
    userId,
    action,
    delta,
    balanceAfter,
    reason,
    createdAt: now()
  });
}

function spend(state: MockState, cost: number, action: Extract<PointAction, "IDEA_UNLOCK" | "AI_EVALUATE">, reason: string) {
  const session = currentSession(state);
  const user = state.users.find((item) => item.id === session.user.id);
  if (!user || user.pointsBalance < cost) {
    return false;
  }
  user.pointsBalance -= cost;
  session.user = user;
  pushTransaction(state, user.id, action, -cost, user.pointsBalance, reason);
  return true;
}

function scoreFromText(idea: IdeaDetail, board?: Whiteboard): AIEvaluation {
  const filled = board?.nodes.filter((node) => node.content.trim().length > 12).length ?? 0;
  const base = Math.min(84, 58 + filled * 4 + Math.round((idea.problem.length + idea.solution.length) / 160));
  return {
    ideaId: idea.id,
    overallScore: base,
    scores: {
      market: Math.min(95, base + 4),
      feasibility: Math.max(35, base - 3),
      profitability: Math.max(35, base - 7),
      differentiation: Math.min(95, base + 1),
      growth: Math.min(95, base + 5)
    },
    summary: `${idea.title}는 문제와 해결책의 연결이 분명합니다. MVP에서는 가장 좁은 사용자군을 먼저 잡고 반복 사용 근거를 확인하는 것이 좋습니다.`,
    suggestions: [
      "타겟 사용자의 현재 대안을 하나로 좁혀 비교하세요.",
      "검증 계획에 인터뷰 수, 테스트 기간, 성공 기준을 숫자로 넣어보세요.",
      "수익 모델은 첫 결제 시점과 가격 단위를 더 구체화하세요."
    ],
    createdAt: now()
  };
}

function runSafely<T>(work: (state: MockState) => ApiResponse<T>): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const state = readState();
      try {
        const result = work(state);
        writeState(state);
        resolve(result);
      } catch (error) {
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          resolve(fail("UNAUTHORIZED", "로그인이 필요합니다."));
          return;
        }
        resolve(fail("VALIDATION_ERROR", "요청을 처리하지 못했습니다."));
      }
    }, 180);
  });
}

export function createMockClient(): IdeaFlowClient {
  return {
    getStoredSession() {
      return readState().session;
    },
    logout() {
      const state = readState();
      state.session = null;
      writeState(state);
    },
    login(input) {
      return runSafely((state) => {
        const email = input.email.toLowerCase();
        let user = state.users.find((item) => item.email === email);
        if (!user) {
          user = createUser(input);
          state.users.push(user);
          pushTransaction(state, user.id, "SIGNUP_BONUS", 30, user.pointsBalance, "가입 보너스");
        } else if (input.username?.trim()) {
          user.username = input.username.trim();
        }
        const session = { token: TOKEN, user };
        state.session = session;
        return ok(session);
      });
    },
    listIdeas() {
      return runSafely((state) => {
        const session = currentSession(state);
        const ideas = [...state.ideas]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((idea) => asCard(idea, session.user.id));
        return ok(ideas);
      });
    },
    getIdea(id) {
      return runSafely((state) => {
        const session = currentSession(state);
        const idea = state.ideas.find((item) => item.id === id);
        if (!idea) {
          return fail("NOT_FOUND", "아이디어를 찾을 수 없습니다.");
        }
        return ok(asDetail(idea, session.user.id));
      });
    },
    createIdea(input: CreateIdeaRequest) {
      return runSafely((state) => {
        const session = currentSession(state);
        const user = state.users.find((item) => item.id === session.user.id);
        if (!user) {
          return fail("UNAUTHORIZED", "로그인이 필요합니다.");
        }
        const idea: MockIdea = {
          id: `idea-${Date.now()}`,
          authorId: user.id,
          title: input.title,
          oneLine: input.oneLine,
          category: input.category as Category,
          coverImageUrl: input.coverImageUrl ?? null,
          authorName: user.username,
          likeCount: 0,
          commentCount: 0,
          unlockCost: 3,
          isUnlocked: true,
          createdAt: now(),
          problem: input.problem,
          solution: input.solution,
          unlockedBy: [user.id]
        };
        state.ideas.unshift(idea);
        state.whiteboards.push(defaultWhiteboard(idea.id));
        user.pointsBalance += 10;
        session.user = user;
        pushTransaction(state, user.id, "IDEA_CREATE", 10, user.pointsBalance, "아이디어 작성");
        return ok(asDetail(idea, user.id));
      });
    },
    unlockIdea(id) {
      return runSafely((state) => {
        const session = currentSession(state);
        const idea = state.ideas.find((item) => item.id === id);
        if (!idea) {
          return fail("NOT_FOUND", "아이디어를 찾을 수 없습니다.");
        }
        if (idea.authorId !== session.user.id && !idea.unlockedBy.includes(session.user.id)) {
          if (!spend(state, idea.unlockCost, "IDEA_UNLOCK", "아이디어 잠금 해제")) {
            return fail("INSUFFICIENT_POINTS", "포인트가 부족합니다.");
          }
          idea.unlockedBy.push(session.user.id);
        }
        return ok(asDetail(idea, session.user.id));
      });
    },
    getWhiteboard(id) {
      return runSafely((state) => {
        currentSession(state);
        const board = state.whiteboards.find((item) => item.ideaId === id);
        return ok(board ?? defaultWhiteboard(id));
      });
    },
    updateWhiteboard(id, input: UpdateWhiteboardRequest) {
      return runSafely((state) => {
        currentSession(state);
        const board = {
          ideaId: id,
          updatedAt: now(),
          nodes: WHITEBOARD_NODE_DEFINITIONS.map((definition) => ({
            ...definition,
            content: input.nodes.find((node) => node.key === definition.key)?.content ?? ""
          }))
        };
        const index = state.whiteboards.findIndex((item) => item.ideaId === id);
        if (index >= 0) {
          state.whiteboards[index] = board;
        } else {
          state.whiteboards.push(board);
        }
        return ok(board);
      });
    },
    getEvaluation(id) {
      return runSafely((state) => {
        currentSession(state);
        return ok(state.evaluations.find((item) => item.ideaId === id) ?? null);
      });
    },
    evaluateIdea(id) {
      return runSafely((state) => {
        const session = currentSession(state);
        const idea = state.ideas.find((item) => item.id === id);
        if (!idea) {
          return fail("NOT_FOUND", "아이디어를 찾을 수 없습니다.");
        }
        if (idea.authorId !== session.user.id) {
          return fail("FORBIDDEN", "작성자만 평가할 수 있습니다.");
        }
        if (!spend(state, 5, "AI_EVALUATE", "AI 평가")) {
          return fail("INSUFFICIENT_POINTS", "포인트가 부족합니다.");
        }
        const detail = asDetail(idea, session.user.id);
        const evaluation = scoreFromText(detail, state.whiteboards.find((item) => item.ideaId === id));
        const index = state.evaluations.findIndex((item) => item.ideaId === id);
        if (index >= 0) {
          state.evaluations[index] = evaluation;
        } else {
          state.evaluations.push(evaluation);
        }
        return ok(evaluation);
      });
    },
    getPoints() {
      return runSafely((state) => {
        const session = currentSession(state);
        const user = state.users.find((item) => item.id === session.user.id) ?? session.user;
        return ok({
          user,
          rules: pointRules,
          transactions: state.transactions
            .filter((transaction) => transaction.userId === user.id)
            .map(({ userId: _userId, ...transaction }) => transaction)
        } satisfies PointSummary);
      });
    }
  };
}
