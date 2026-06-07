import {
  WHITEBOARD_NODE_DEFINITIONS,
  type AIEvaluation,
  type ApiResponse,
  type AuthSession,
  type Category,
  type CreateCommentRequest,
  type CreateIdeaRequest,
  type ErrorCode,
  type IdeaCard,
  type IdeaComment,
  type IdeaDetail,
  type LoginRequest,
  type PointAction,
  type PointLedgerEntry,
  type PointRule,
  type PointSummary,
  type UpdateWhiteboardRequest,
  type User,
  type Whiteboard,
  type WhiteboardAssistantMessage,
  type WhiteboardAssistantRequest,
  type WhiteboardAssistantResponse,
  type WhiteboardNode
} from "@ideaflow/shared/types";
import type { IdeaFlowClient } from "./client";
import { createCoreNode, defaultEdges, defaultViewport } from "./whiteboard";

const STATE_KEY = "ideaflow.mock-state.v7";
const TOKEN = "mock-token";

const pointRules: PointRule[] = [
  { action: "SIGNUP_BONUS", delta: 30, label: "가입 보너스" },
  { action: "IDEA_CREATE", delta: 10, label: "아이디어 작성" },
  { action: "COMMENT_WRITE", delta: 3, label: "댓글 작성" },
  { action: "LIKE_RECEIVED", delta: 1, label: "좋아요 받음" },
  { action: "IDEA_UNLOCK", delta: -3, label: "아이디어 잠금 해제" },
  { action: "AI_EVALUATE", delta: -5, label: "AI 평가" }
];

type MockIdea = IdeaDetail & {
  authorId: string;
  unlockedBy: string[];
  likedBy: string[];
};

type MockTransaction = PointLedgerEntry & {
  userId: string;
};

interface MockState {
  session: AuthSession | null;
  users: User[];
  ideas: MockIdea[];
  comments: IdeaComment[];
  whiteboards: Whiteboard[];
  assistantMessages: Array<WhiteboardAssistantMessage & { ideaId: string }>;
  evaluations: AIEvaluation[];
  transactions: MockTransaction[];
}

const seedUsers: User[] = [
  { id: "seed-user-1", email: "mina@example.com", username: "김민아", profileImageUrl: null, pointsBalance: 30 },
  { id: "seed-user-2", email: "joon@example.com", username: "박준호", profileImageUrl: null, pointsBalance: 30 },
  { id: "seed-user-3", email: "sora@example.com", username: "이소라", profileImageUrl: null, pointsBalance: 30 },
  { id: "seed-user-4", email: "haru@example.com", username: "최하루", profileImageUrl: null, pointsBalance: 30 },
  { id: "seed-user-5", email: "yuna@example.com", username: "정유나", profileImageUrl: null, pointsBalance: 30 }
];

const sampleCategories: Category[] = ["AI", "EDU", "TRAVEL", "ENV", "HEALTH", "ETC"];

const sampleIdeas = [
  {
    title: "AI 발표 코치",
    oneLine: "발표 영상을 분석해 말의 속도, 시선, 핵심 메시지를 피드백합니다.",
    problem: "발표 연습은 혼자 반복하기 쉽지만, 객관적인 피드백을 받기 어렵습니다.",
    solution: "영상과 음성을 분석해 발표 속도, 멈춤, 시선 처리, 말의 구조를 점수화합니다."
  },
  {
    title: "개인 맞춤 여행 동선 빌더",
    oneLine: "여행 취향과 예산을 입력하면 숙소와 이동 동선을 함께 추천합니다.",
    problem: "여행자는 항공권, 숙소, 장소 정보를 여러 사이트에서 비교하느라 시간을 많이 씁니다.",
    solution: "취향, 예산, 기간을 입력하면 하루 단위 동선과 숙소 후보를 한 번에 제안합니다."
  },
  {
    title: "동네 리필 스테이션 지도",
    oneLine: "가까운 리필 매장을 찾고 방문 인증으로 친환경 포인트를 모읍니다.",
    problem: "친환경 소비를 하고 싶어도 가까운 리필 매장과 가격 정보를 찾기 어렵습니다.",
    solution: "위치 기반 매장 지도와 방문 인증, 가격 공유 기능으로 재방문을 돕습니다."
  },
  {
    title: "공부 습관 스프린트룸",
    oneLine: "같은 목표를 가진 사람들이 짧은 집중 세션으로 공부 습관을 만듭니다.",
    problem: "혼자 공부하면 시작이 늦어지고, 꾸준히 이어갈 동기가 쉽게 떨어집니다.",
    solution: "25분 집중 세션과 체크인 기록, 소규모 그룹 피드백을 제공합니다."
  },
  {
    title: "마이크로 운동 리마인더",
    oneLine: "하루 3분 운동을 놓치지 않도록 상황별 알림과 기록을 제공합니다.",
    problem: "운동을 시작하려는 사람은 시간이 부족하다는 이유로 계획을 자주 미룹니다.",
    solution: "업무 중, 이동 전, 취침 전처럼 짧은 틈새 시간에 맞춘 운동 루틴을 추천합니다."
  },
  {
    title: "제로웨이스트 리워드 지갑",
    oneLine: "다회용기 사용과 장바구니 실천을 포인트 지갑으로 연결합니다.",
    problem: "개인의 친환경 실천은 기록되기 어렵고, 보상이 없어 지속하기 어렵습니다.",
    solution: "매장 인증과 사진 기록을 통해 실천 포인트를 적립하고 동네 혜택과 연결합니다."
  },
  {
    title: "면접 질문 시뮬레이터",
    oneLine: "지원 직무에 맞춘 질문을 생성하고 답변의 구조를 점검합니다.",
    problem: "면접 준비자는 예상 질문을 찾고 답변을 다듬는 데 많은 시간을 씁니다.",
    solution: "직무와 경력 정보를 기반으로 질문을 만들고 답변의 논리 구조를 피드백합니다."
  },
  {
    title: "동네 메이커 클래스 찾기",
    oneLine: "동네 전문가의 짧은 클래스를 발견하고 소규모 모임을 예약합니다.",
    problem: "가까운 곳의 소규모 강좌는 흩어져 있어 발견하기 어렵고 예약도 번거롭습니다.",
    solution: "지역, 시간, 관심사 기준으로 클래스를 모아 보여주고 간편 예약을 제공합니다."
  },
  {
    title: "원격팀 감정 보드",
    oneLine: "원격 근무 팀의 감정 신호를 가볍게 모아 회고 주제를 추천합니다.",
    problem: "원격팀은 팀원의 피로도와 업무 감정을 늦게 알아차리는 경우가 많습니다.",
    solution: "짧은 감정 체크와 익명 신호를 모아 회고에서 다룰 주제를 제안합니다."
  },
  {
    title: "예산 기반 식단 플래너",
    oneLine: "남은 예산과 냉장고 재료를 기준으로 일주일 식단을 제안합니다.",
    problem: "식비를 아끼고 싶어도 남은 재료와 예산을 함께 고려한 계획을 세우기 어렵습니다.",
    solution: "보유 재료, 예산, 선호 음식을 입력하면 장보기 목록과 식단을 자동 구성합니다."
  },
  {
    title: "탄소 영수증 분석기",
    oneLine: "영수증을 찍으면 소비별 탄소 배출량과 줄이는 방법을 보여줍니다.",
    problem: "일상 소비가 환경에 어떤 영향을 주는지 체감하기 어렵습니다.",
    solution: "구매 품목을 분류해 예상 탄소 배출량을 보여주고 대체 소비를 추천합니다."
  },
  {
    title: "크리에이터 피드백 교환소",
    oneLine: "초기 창작물을 올리고 같은 단계의 크리에이터에게 피드백을 받습니다.",
    problem: "초기 창작자는 완성 전 피드백을 받을 안전한 공간을 찾기 어렵습니다.",
    solution: "작업물을 올리면 같은 분야 크리에이터와 피드백을 교환하고 개선 기록을 남깁니다."
  }
];

function ok<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

function fail<T>(code: ErrorCode, message: string): ApiResponse<T> {
  return { success: false, error: { code, message } };
}

function now(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

function cloneDefaultEdges() {
  return defaultEdges.map((edge) => ({ ...edge }));
}

function defaultWhiteboard(ideaId: string): Whiteboard {
  return {
    ideaId,
    updatedAt: now(),
    nodes: WHITEBOARD_NODE_DEFINITIONS.map((node) => createCoreNode(node.key)),
    edges: cloneDefaultEdges(),
    viewport: { ...defaultViewport }
  };
}

function normalizeWhiteboard(ideaId: string, board?: Partial<Whiteboard> & { nodes?: WhiteboardNode[] }): Whiteboard {
  const base = defaultWhiteboard(ideaId);
  if (!board) return base;

  const rawNodes = Array.isArray(board.nodes) ? board.nodes : [];
  const coreNodes = base.nodes.map((baseNode) => {
    const savedNode = rawNodes.find((node) => node.key === baseNode.key || node.id === baseNode.id);
    return {
      ...baseNode,
      position: savedNode?.position ?? baseNode.position,
      size: savedNode?.size ?? baseNode.size,
      content: savedNode?.content ?? ""
    };
  });

  const customNodes: WhiteboardNode[] = rawNodes
    .filter((node) => !node.key)
    .map((node, index) => ({
      id: node.id || `memo-${index + 1}`,
      type: node.type ?? "memo",
      label: node.label || node.title || "Memo",
      title: node.title || node.label || "Memo",
      content: node.content ?? "",
      position: node.position ?? { x: 760 + index * 24, y: 80 + index * 24 },
      size: node.size,
      locked: node.locked
    }));

  return {
    ideaId,
    updatedAt: board.updatedAt ?? now(),
    nodes: [...coreNodes, ...customNodes],
    edges: board.edges?.length ? board.edges.map((edge) => ({ ...edge })) : cloneDefaultEdges(),
    viewport: board.viewport ?? { ...defaultViewport }
  };
}

function mockAssistantResponse(
  idea: IdeaDetail,
  board: Whiteboard,
  input: WhiteboardAssistantRequest
): any {
  const targetNodeKey =
    input.targetNodeKey ??
    (board.nodes
      .filter((node) => node.key)
      .sort((a, b) => a.content.trim().length - b.content.trim().length)[0]?.key ?? "problemContext");
  const message = input.message.trim();
  const target = board.nodes.find((node) => node.key === "targetUser")?.content.trim() || "초기 타깃 사용자";
  const mvp = board.nodes.find((node) => node.key === "validationPlan")?.content.trim() || "첫 MVP 검증 계획";

  return {
    reply: `${idea.title}는 ${targetNodeKey} 칸을 먼저 구체화하면 다음 평가가 좋아집니다. 지금 질문을 기준으로 바로 넣을 수 있는 초안을 만들었어요.`,
    targetNodeKey,
    suggestion: `"${message}" 상황에서 사용자가 이미 쓰는 대안, 실패하는 이유, 첫 MVP에서 검증할 행동을 한 문장씩 적어보세요.`,
    followUps: [
      "사용자가 지금 쓰는 대안은 무엇인가요?",
      "첫 MVP에서 반드시 검증할 행동은 무엇인가요?",
      "돈을 낼 가능성을 어떻게 확인할 수 있나요?"
    ],
    report: {
      ideaSummary: `${idea.title}은 ${idea.oneLine}`,
      problem: board?.nodes.find((node) => node.key === "problemContext")?.content.trim() || idea.problem,
      solution: board?.nodes.find((node) => node.key === "solutionConcept")?.content.trim() || idea.solution,
      mvp,
      developmentPlan: [
        "로그인, 아이디어 작성, 화이트보드 저장 흐름을 안정화합니다.",
        "AI Assistant 제안을 노드에 적용하는 흐름을 검증합니다.",
        "AI 평가 리포트를 사용자 인터뷰 결과와 비교합니다.",
        "MVP 범위를 줄이고 반복 사용 의향을 확인합니다."
      ],
      marketAnalysis: `${target}가 현재 대안을 버릴 만큼 시간이 절약되는지 확인하는 것이 초기 시장성 검증의 핵심입니다.`,
      targetAudience: target,
      keyRisks: [
        "타깃이 넓으면 MVP 가치가 흐려질 수 있습니다.",
        "AI 결과 품질이 낮으면 사용자가 보드를 계속 쓰지 않을 수 있습니다.",
        "수익 모델 검증이 늦어지면 실제 사업성이 불분명해질 수 있습니다."
      ]
    },
    createdAt: now()
  };
}

function mockAssistantConversationResponse(
  idea: IdeaDetail,
  board: Whiteboard,
  input: WhiteboardAssistantRequest
): WhiteboardAssistantResponse {
  const targetNodeKey =
    input.targetNodeKey ??
    (board.nodes
      .filter((node) => node.key)
      .sort((a, b) => a.content.trim().length - b.content.trim().length)[0]?.key ?? "problemContext");
  const message = input.message.trim();
  const historyCount = input.history?.length ?? 0;
  const createdAt = now();
  const reply =
    historyCount > 0
      ? `${idea.title}의 앞선 대화 ${historyCount}개를 이어서 보면 ${targetNodeKey} 칸을 더 좁히는 게 좋습니다. 바로 넣을 수 있는 다음 초안을 만들었어요.`
      : `${idea.title}는 ${targetNodeKey} 칸을 먼저 구체화하면 다음 평가가 좋아집니다. 지금 질문을 기준으로 바로 넣을 수 있는 초안을 만들었어요.`;
  const suggestion = `"${message}" 상황에서 사용자가 이미 쓰는 대안, 실패하는 이유, 첫 MVP에서 검증할 행동을 한 문장씩 적어보세요.`;
  const followUps = [
    "사용자가 지금 쓰는 대안은 무엇인가요?",
    "첫 MVP에서 반드시 검증할 행동은 무엇인가요?",
    "돈을 낼 가능성을 어떻게 확인할 수 있나요?"
  ];

  return {
    reply,
    targetNodeKey,
    suggestion,
    followUps,
    messages: [
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: input.message,
        targetNodeKey: input.targetNodeKey,
        createdAt
      },
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
        targetNodeKey,
        suggestion,
        followUps,
        createdAt
      }
    ],
    createdAt
  };
}

function mockFounderAssistantConversationResponse(
  idea: IdeaDetail,
  board: Whiteboard,
  input: WhiteboardAssistantRequest
): WhiteboardAssistantResponse {
  const targetNodeKey =
    input.targetNodeKey ??
    (board.nodes
      .filter((node) => node.key)
      .sort((a, b) => a.content.trim().length - b.content.trim().length)[0]?.key ?? "problemContext");
  const message = input.message.trim() || idea.oneLine;
  const historyCount = input.history?.length ?? 0;
  const filledCount = board.nodes.filter((node) => node.content.trim().length > 15).length;
  const createdAt = now();
  const reply = [
    `창업가 관점으로 보면 지금은 ${targetNodeKey} 노드를 더 날카롭게 만들어야 합니다.`,
    "아이디어가 좋아 보이는지보다, 특정 고객이 지금 이 문제 때문에 실제로 시간이나 돈을 잃고 있는지가 먼저입니다.",
    `현재 보드는 ${filledCount}/7개 노드가 채워졌지만, 아직 사실과 가설이 섞여 있습니다.`,
    historyCount > 0
      ? `앞선 대화 ${historyCount}개를 보면 다음 단계는 기능 추가가 아니라 더 좁은 고객과 더 작은 검증 실험입니다.`
      : "다음 단계는 기능을 늘리는 것이 아니라 가장 위험한 가설 하나를 이번 주 안에 검증하는 것입니다."
  ].join("\n");
  const suggestion = `"${message}"를 기준으로, 고객이 이미 쓰는 대안, 그 대안이 실패하는 장면, 첫 MVP에서 검증할 행동 지표를 한 문단으로 적어보세요.`;
  const followUps = [
    "이 아이디어가 nice-to-have가 아니라 must-have라는 가장 강한 증거는 무엇인가요?",
    "가장 먼저 돈이나 시간을 쓸 가능성이 높은 10명은 누구인가요?",
    "이번 주 안에 실패를 판정할 수 있는 가장 작은 실험은 무엇인가요?"
  ];

  return {
    reply,
    targetNodeKey,
    suggestion,
    followUps,
    messages: [
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: input.message,
        targetNodeKey: input.targetNodeKey,
        createdAt
      },
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
        targetNodeKey,
        suggestion,
        followUps,
        createdAt
      }
    ],
    createdAt
  };
}

function createSampleIdeas(): MockIdea[] {
  return Array.from({ length: 72 }, (_, index) => {
    const author = seedUsers[index % seedUsers.length] ?? seedUsers[0]!;
    const category = sampleCategories[index % sampleCategories.length] ?? "ETC";
    const sample = sampleIdeas[index % sampleIdeas.length] ?? sampleIdeas[0]!;
    const likeCount = 4 + ((index * 7) % 48);

    return {
      id: `seed-idea-${index + 1}`,
      authorId: author.id,
      title: `${sample.title} ${index + 1}`,
      oneLine: sample.oneLine,
      category,
      coverImageUrl: null,
      authorName: author.username,
      likeCount,
      commentCount: 1 + ((index * 3) % 12),
      unlockCost: 3,
      isUnlocked: false,
      createdAt: now(-index * 18),
      problem: `${sample.problem} 이 샘플은 무한 피드 스크롤 테스트를 위해 만든 ${index + 1}번째 한국어 데이터입니다.`,
      solution: `${sample.solution} 첫 화면부터 상세 보기까지 한국어 문장으로 흐름을 확인할 수 있습니다.`,
      unlockedBy: [],
      likedBy: []
    };
  });
}

function createInitialState(): MockState {
  const ideas = createSampleIdeas();
  return {
    session: null,
    users: seedUsers,
    ideas,
    comments: [],
    whiteboards: ideas.map((idea) => defaultWhiteboard(idea.id)),
    assistantMessages: [],
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
    username: input.username?.trim() || email.split("@")[0] || "아이디어 메이커",
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

function scoreFromText(idea: IdeaDetail, board?: Whiteboard): any {
  const filled = board?.nodes.filter((node) => node.content.trim().length > 12).length ?? 0;
  const base = Math.min(88, 56 + filled * 5 + Math.round((idea.problem.length + idea.solution.length) / 150));
  const target = board?.nodes.find((node) => node.key === "targetUser")?.content.trim() || "초기 타깃 사용자를 더 구체화해야 합니다.";
  const mvp =
    board?.nodes.find((node) => node.key === "validationPlan")?.content.trim() ||
    "핵심 입력, AI 제안 확인, 저장까지의 한 사이클을 MVP로 제안합니다.";
  return {
    ideaId: idea.id,
    overallScore: base,
    scores: {
      market: Math.min(95, base + 5),
      feasibility: Math.max(35, base - 4),
      profitability: Math.max(35, base - 7),
      differentiation: Math.min(95, base + 2),
      growth: Math.min(95, base + 6)
    },
    summary: `${idea.title}은 문제와 해결책의 연결이 분명합니다. MVP에서는 좁은 사용자군부터 시작해 반복 사용 근거를 확인하는 것이 좋습니다.`,
    suggestions: [
      "타깃 사용자를 현재 대안 하나와 연결해 더 좁혀 보세요.",
      "검증 계획에 인터뷰 수, 테스트 기간, 성공 기준을 숫자로 넣어 보세요.",
      "첫 결제 시점과 가격 단위를 더 구체적으로 정리해 보세요."
    ],
    createdAt: now()
  };
}

function ensureEvaluationReport(evaluation: AIEvaluation, idea: IdeaDetail, board?: Whiteboard): AIEvaluation {
  if (evaluation.report) return evaluation;

  const target = board?.nodes.find((node) => node.key === "targetUser")?.content.trim() || "초기 타깃 사용자를 더 구체화해야 합니다.";
  const mvp =
    board?.nodes.find((node) => node.key === "validationPlan")?.content.trim() ||
    "핵심 입력, AI 제안 확인, 저장까지의 한 사이클을 MVP로 제안합니다.";

  return {
    ...evaluation,
    report: {
      ideaSummary: `${idea.title}은 ${idea.oneLine}`,
      problem: board?.nodes.find((node) => node.key === "problemContext")?.content.trim() || idea.problem,
      solution: board?.nodes.find((node) => node.key === "solutionConcept")?.content.trim() || idea.solution,
      mvp,
      developmentPlan: [
        "로그인, 아이디어 작성, 화이트보드 저장 흐름을 안정화합니다.",
        "AI Assistant 제안을 노드에 적용하는 흐름을 검증합니다.",
        "AI 평가 리포트를 사용자 인터뷰 결과와 비교합니다.",
        "MVP 범위를 줄이고 반복 사용 의향을 확인합니다."
      ],
      marketAnalysis: `${target}가 현재 대안을 버릴 만큼 시간이 절약되는지 확인하는 것이 초기 시장성 검증의 핵심입니다.`,
      targetAudience: target,
      keyRisks: [
        "타깃이 넓으면 MVP 가치가 흐려질 수 있습니다.",
        "AI 결과 품질이 낮으면 사용자가 보드를 계속 쓰지 않을 수 있습니다.",
        "수익 모델 검증이 늦어지면 실제 사업성이 불분명해질 수 있습니다."
      ]
    }
  };
}

function runSafely<T>(work: (state: MockState) => ApiResponse<T>, delay = 180): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const state = readState();
      try {
        const result = work(state);
        writeState(state);
        resolve(result);
      } catch (error) {
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          state.session = null;
          writeState(state);
          resolve(fail("UNAUTHORIZED", "로그인이 만료되었습니다. 다시 로그인해 주세요."));
          return;
        }
        resolve(fail("VALIDATION_ERROR", "요청을 처리하지 못했습니다."));
      }
    }, delay);
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
        const session = { token: `${TOKEN}-${input.provider ?? "email"}`, user };
        state.session = session;
        return ok(session);
      });
    },
    listIdeas(input) {
      return runSafely((state) => {
        const session = currentSession(state);
        let ideas = [...state.ideas];
        if (input?.tab === "recommended") {
          ideas = ideas.sort((a, b) => b.likeCount - a.likeCount);
        } else if (input?.tab === "following") {
          ideas = ideas.filter((idea) => idea.authorId !== session.user.id);
        } else {
          ideas = ideas.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }
        return ok(ideas.map((idea) => asCard(idea, session.user.id)));
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
          unlockedBy: [user.id],
          likedBy: []
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
            return fail("INSUFFICIENT_POINTS", "포인트가 부족합니다. 글 작성이나 활동으로 포인트를 모아 주세요.");
          }
          idea.unlockedBy.push(session.user.id);
        }
        return ok(asDetail(idea, session.user.id));
      });
    },
    likeIdea(id) {
      return runSafely((state) => {
        const session = currentSession(state);
        const idea = state.ideas.find((item) => item.id === id);
        if (!idea) {
          return fail("NOT_FOUND", "아이디어를 찾을 수 없습니다.");
        }
        if (!idea.likedBy.includes(session.user.id)) {
          idea.likedBy.push(session.user.id);
          idea.likeCount += 1;
          const author = state.users.find((item) => item.id === idea.authorId);
          if (author && author.id !== session.user.id) {
            author.pointsBalance += 1;
            pushTransaction(state, author.id, "LIKE_RECEIVED", 1, author.pointsBalance, "좋아요 받음");
          }
        }
        return ok(asCard(idea, session.user.id));
      });
    },
    listComments(id) {
      return runSafely((state) => {
        currentSession(state);
        const idea = state.ideas.find((item) => item.id === id);
        if (!idea) {
          return fail("NOT_FOUND", "아이디어를 찾을 수 없습니다.");
        }
        return ok(state.comments.filter((comment) => comment.ideaId === id));
      });
    },
    createComment(id, input: CreateCommentRequest) {
      return runSafely((state) => {
        const session = currentSession(state);
        const idea = state.ideas.find((item) => item.id === id);
        if (!idea) {
          return fail("NOT_FOUND", "아이디어를 찾을 수 없습니다.");
        }

        const content = input.content.trim();
        if (!content) {
          return fail("VALIDATION_ERROR", "댓글 내용을 입력해주세요.");
        }

        const user = state.users.find((item) => item.id === session.user.id) ?? session.user;
        const comment: IdeaComment = {
          id: `comment-${Date.now()}-${state.comments.length}`,
          ideaId: id,
          authorName: user.username,
          authorProfileImageUrl: user.profileImageUrl,
          content,
          createdAt: now()
        };

        state.comments.push(comment);
        idea.commentCount += 1;
        user.pointsBalance += 3;
        session.user = user;
        pushTransaction(state, user.id, "COMMENT_WRITE", 3, user.pointsBalance, "댓글 작성");

        return ok(comment);
      });
    },
    getWhiteboard(id) {
      return runSafely((state) => {
        currentSession(state);
        const board = state.whiteboards.find((item) => item.ideaId === id);
        return ok(normalizeWhiteboard(id, board));
      });
    },
    updateWhiteboard(id, input: UpdateWhiteboardRequest) {
      return runSafely((state) => {
        currentSession(state);
        const board = normalizeWhiteboard(id, {
          ideaId: id,
          updatedAt: now(),
          nodes: input.nodes,
          edges: input.edges,
          viewport: input.viewport
        });
        const index = state.whiteboards.findIndex((item) => item.ideaId === id);
        if (index >= 0) {
          state.whiteboards[index] = board;
        } else {
          state.whiteboards.push(board);
        }
        return ok(board);
      });
    },
    getWhiteboardAssistantMessages(id) {
      return runSafely((state) => {
        currentSession(state);
        const messages = state.assistantMessages
          .filter((message) => message.ideaId === id)
          .map(({ ideaId: _ideaId, ...message }) => message);
        return ok(messages);
      });
    },
    askWhiteboardAssistant(id, input: WhiteboardAssistantRequest) {
      return runSafely((state) => {
        currentSession(state);
        const idea = state.ideas.find((item) => item.id === id);
        if (!idea) {
          return fail("NOT_FOUND", "아이디어를 찾을 수 없습니다.");
        }
        const board = normalizeWhiteboard(id, input.board ?? state.whiteboards.find((item) => item.ideaId === id));
        const history = state.assistantMessages
          .filter((message) => message.ideaId === id)
          .map(({ ideaId: _ideaId, ...message }) => message);
        const response = mockFounderAssistantConversationResponse(idea, board, { ...input, history });
        const savedMessages = response.messages.map((message) => ({ ...message, ideaId: id }));
        state.assistantMessages.push(...savedMessages);
        return ok({
          ...response,
          messages: savedMessages.map(({ ideaId: _ideaId, ...message }) => message)
        });
      });
    },
    getEvaluation(id) {
      return runSafely((state) => {
        currentSession(state);
        const evaluation = state.evaluations.find((item) => item.ideaId === id);
        const idea = state.ideas.find((item) => item.id === id);
        if (!evaluation || !idea) return ok(null);
        return ok(ensureEvaluationReport(evaluation, asDetail(idea, idea.authorId), state.whiteboards.find((item) => item.ideaId === id)));
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
          return fail("FORBIDDEN", "작성자만 AI 평가를 실행할 수 있습니다.");
        }
        if (!spend(state, 5, "AI_EVALUATE", "AI 평가")) {
          return fail("INSUFFICIENT_POINTS", "AI 평가에 필요한 5P가 부족합니다.");
        }
        const detail = asDetail(idea, session.user.id);
        const board = state.whiteboards.find((item) => item.ideaId === id);
        const evaluation = ensureEvaluationReport(scoreFromText(detail, board), detail, board);
        const index = state.evaluations.findIndex((item) => item.ideaId === id);
        if (index >= 0) {
          state.evaluations[index] = evaluation;
        } else {
          state.evaluations.push(evaluation);
        }
        return ok(evaluation);
      }, 1800);
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
