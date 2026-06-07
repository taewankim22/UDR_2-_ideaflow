import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  WHITEBOARD_NODE_DEFINITIONS,
  WHITEBOARD_NODE_KEYS,
  type AIEvaluation,
  type AIEvaluationReport,
  type Category,
  type CreateCommentRequest,
  type CreateIdeaRequest,
  type IdeaCard,
  type IdeaComment,
  type IdeaDetail,
  type Whiteboard,
  type WhiteboardAssistantMessage,
  type WhiteboardEdge,
  type WhiteboardAssistantRequest,
  type WhiteboardNode,
  type WhiteboardNodeKey,
  type WhiteboardViewport
} from "@ideaflow/shared/types";
import { asyncHandler } from "../lib/asyncHandler.js";
import { ok } from "../lib/apiResponse.js";
import { AppError } from "../lib/appError.js";
import { prisma } from "../lib/prisma.js";
import { optionalAuth, requireAuth, type AuthRequest } from "../middleware/auth.js";
import { evaluateIdea } from "../services/aiEvaluation.js";
import { generateWhiteboardAssistant } from "../services/whiteboardAssistant.js";
import { addPoints, spendPoints } from "../services/points.js";

const router = Router();

const categorySchema = z.enum(["AI", "EDU", "TRAVEL", "ENV", "HEALTH", "ETC"]);
const feedTabSchema = z.enum(["recommended", "latest", "following"]);
const whiteboardNodeKeySchema = z.enum(WHITEBOARD_NODE_KEYS);
const whiteboardNodeTypeSchema = z.enum(["core", "memo", "ai-question", "risk", "opportunity"]);

const defaultViewport: WhiteboardViewport = { x: 0, y: 0, zoom: 1 };

const defaultPositions: Record<WhiteboardNodeKey, { x: number; y: number }> = {
  problemContext: { x: 80, y: 80 },
  targetUser: { x: 80, y: 290 },
  currentAlternatives: { x: 80, y: 500 },
  solutionConcept: { x: 390, y: 80 },
  coreValue: { x: 390, y: 290 },
  revenueModel: { x: 700, y: 290 },
  validationPlan: { x: 390, y: 500 }
};

const defaultEdges: WhiteboardEdge[] = [
  { id: "edge-problem-solution", source: "core-problemContext", target: "core-solutionConcept" },
  { id: "edge-target-value", source: "core-targetUser", target: "core-coreValue" },
  { id: "edge-solution-value", source: "core-solutionConcept", target: "core-coreValue" },
  { id: "edge-value-mvp", source: "core-coreValue", target: "core-validationPlan" }
];

const createIdeaSchema = z.object({
  title: z.string().trim().min(2).max(80),
  oneLine: z.string().trim().min(5).max(140),
  problem: z.string().trim().min(10).max(2000),
  solution: z.string().trim().min(10).max(2000),
  category: categorySchema,
  coverImageUrl: z.string().url().nullable().optional()
}) satisfies z.ZodType<CreateIdeaRequest>;

const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(800)
}) satisfies z.ZodType<CreateCommentRequest>;

const positionSchema = z.object({
  x: z.number(),
  y: z.number()
});

const whiteboardNodeSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  type: whiteboardNodeTypeSchema.optional(),
  key: whiteboardNodeKeySchema.optional(),
  label: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(80).optional(),
  content: z.string().max(2000),
  position: positionSchema.optional(),
  size: z
    .object({
      width: z.number().min(120).max(600),
      height: z.number().min(80).max(500)
    })
    .optional(),
  locked: z.boolean().optional()
});

const whiteboardEdgeSchema = z.object({
  id: z.string().trim().min(1).max(100),
  source: z.string().trim().min(1).max(100),
  target: z.string().trim().min(1).max(100),
  label: z.string().trim().max(60).optional()
});

const whiteboardViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().min(0.2).max(2)
});

const whiteboardSchema = z.object({
  nodes: z.array(whiteboardNodeSchema).min(1).max(80),
  edges: z.array(whiteboardEdgeSchema).max(160).optional(),
  viewport: whiteboardViewportSchema.optional()
});

const whiteboardAssistantMessageSchema = z.object({
  id: z.string().trim().min(1).max(120),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
  targetNodeKey: whiteboardNodeKeySchema.optional(),
  suggestion: z.string().trim().max(2000).optional(),
  followUps: z.array(z.string().trim().max(400)).max(6).optional(),
  createdAt: z.string().trim().min(1).max(80)
});

const whiteboardAssistantSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  targetNodeKey: whiteboardNodeKeySchema.optional(),
  board: whiteboardSchema
    .extend({
      ideaId: z.string().optional(),
      updatedAt: z.string().optional()
    })
    .optional(),
  history: z.array(whiteboardAssistantMessageSchema).max(20).optional()
});

type WhiteboardNodeInput = Partial<WhiteboardNode> & {
  label?: string;
  content?: string;
};

function createCoreNode(key: WhiteboardNodeKey, content = ""): WhiteboardNode {
  const definition = WHITEBOARD_NODE_DEFINITIONS.find((node) => node.key === key);
  const label = definition?.label ?? key;
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

function defaultWhiteboardPayload(): Pick<Whiteboard, "nodes" | "edges" | "viewport"> {
  return {
    nodes: WHITEBOARD_NODE_DEFINITIONS.map((node) => createCoreNode(node.key)),
    edges: defaultEdges,
    viewport: defaultViewport
  };
}

function normalizeWhiteboardNodes(nodes: WhiteboardNodeInput[]): WhiteboardNode[] {
  const byKey = new Map(
    nodes
      .filter((node): node is WhiteboardNodeInput & { key: WhiteboardNodeKey } => Boolean(node.key))
      .map((node) => [node.key, node] as const)
  );
  const coreNodes = WHITEBOARD_NODE_DEFINITIONS.map((definition) => {
    const existing = byKey.get(definition.key);
    return {
      ...createCoreNode(definition.key, existing?.content?.trim() ?? ""),
      ...existing,
      id: existing?.id || `core-${definition.key}`,
      type: "core" as const,
      key: definition.key,
      label: existing?.label || definition.label,
      title: existing?.title || existing?.label || definition.label,
      position: existing?.position ?? defaultPositions[definition.key],
      locked: true
    };
  });

  const extraNodes = nodes
    .filter((node) => node.type !== "core" && !node.key)
    .map((node, index) => ({
      id: node.id || `memo-${index + 1}`,
      type: node.type || "memo",
      label: node.label || node.title || "Memo",
      title: node.title || node.label || "Memo",
      content: node.content ?? "",
      position: node.position ?? { x: 760, y: 80 },
      size: node.size,
      locked: node.locked
    }));

  return [...coreNodes, ...extraNodes];
}

function normalizeWhiteboardPayload(value: unknown): Pick<Whiteboard, "nodes" | "edges" | "viewport"> {
  const legacyOrNodes = Array.isArray(value) ? value : (value as { nodes?: unknown })?.nodes;
  const parsedNodes = Array.isArray(legacyOrNodes) ? (legacyOrNodes as WhiteboardNodeInput[]) : [];
  const rawObject = !Array.isArray(value) && value && typeof value === "object" ? (value as Partial<Whiteboard>) : null;

  return {
    nodes: normalizeWhiteboardNodes(parsedNodes.length ? parsedNodes : defaultWhiteboardPayload().nodes),
    edges: Array.isArray(rawObject?.edges) ? rawObject.edges : defaultEdges,
    viewport: rawObject?.viewport ?? defaultViewport
  };
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function getParamId(req: AuthRequest) {
  const id = req.params.id;
  if (typeof id !== "string") {
    throw new AppError(400, "VALIDATION_ERROR", "아이디어 ID가 필요합니다.");
  }
  return id;
}

function getUserId(req: AuthRequest) {
  if (!req.user) {
    throw new AppError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }
  return req.user.id;
}

function serializeCard(
  idea: {
    id: string;
    title: string;
    oneLine: string;
    category: Category;
    coverImageUrl: string | null;
    likeCount: number;
    commentCount: number;
    unlockCost: number;
    authorId: string;
    createdAt: Date;
    author?: { id: string; username: string };
  },
  userId: string | null,
  unlockedIds: Set<string>
): IdeaCard {
  return {
    id: idea.id,
    title: idea.title,
    oneLine: idea.oneLine,
    category: idea.category,
    coverImageUrl: idea.coverImageUrl,
    authorName: idea.author?.username ?? "Unknown",
    likeCount: idea.likeCount,
    commentCount: idea.commentCount,
    unlockCost: idea.unlockCost,
    isUnlocked: idea.authorId === userId || unlockedIds.has(idea.id),
    createdAt: idea.createdAt.toISOString()
  };
}

function serializeDetail(
  idea: Parameters<typeof serializeCard>[0] & { problem: string; solution: string },
  userId: string | null,
  unlockedIds: Set<string>
): IdeaDetail {
  const card = serializeCard(idea, userId, unlockedIds);
  return {
    ...card,
    problem: card.isUnlocked ? idea.problem : "",
    solution: card.isUnlocked ? idea.solution : ""
  };
}

function serializeComment(raw: {
  id: string;
  ideaId: string;
  content: string;
  createdAt: Date;
  author?: { username: string; profileImageUrl: string | null };
}): IdeaComment {
  return {
    id: raw.id,
    ideaId: raw.ideaId,
    authorName: raw.author?.username ?? "Unknown",
    authorProfileImageUrl: raw.author?.profileImageUrl ?? null,
    content: raw.content,
    createdAt: raw.createdAt.toISOString()
  };
}

async function serializeOwnIdeaDetail(idea: Awaited<ReturnType<typeof assertIdeaOwner>>): Promise<IdeaDetail> {
  const author = await prisma.user.findUniqueOrThrow({ where: { id: idea.authorId } });
  return {
    id: idea.id,
    title: idea.title,
    oneLine: idea.oneLine,
    category: idea.category as Category,
    coverImageUrl: idea.coverImageUrl,
    authorName: author.username,
    likeCount: idea.likeCount,
    commentCount: idea.commentCount,
    unlockCost: idea.unlockCost,
    isUnlocked: true,
    createdAt: idea.createdAt.toISOString(),
    problem: idea.problem,
    solution: idea.solution
  };
}

function serializeWhiteboard(raw: { ideaId: string; nodes: unknown; updatedAt: Date }): Whiteboard {
  return {
    ideaId: raw.ideaId,
    updatedAt: raw.updatedAt.toISOString(),
    ...normalizeWhiteboardPayload(raw.nodes)
  };
}

function serializeAssistantMessage(raw: {
  id: string;
  role: string;
  content: string;
  targetNodeKey: string | null;
  suggestion: string | null;
  followUps: unknown;
  createdAt: Date;
}): WhiteboardAssistantMessage {
  const targetNodeKey = WHITEBOARD_NODE_KEYS.includes(raw.targetNodeKey as WhiteboardNodeKey)
    ? (raw.targetNodeKey as WhiteboardNodeKey)
    : undefined;
  const followUps = Array.isArray(raw.followUps) ? raw.followUps.filter((item): item is string => typeof item === "string") : undefined;

  return {
    id: raw.id,
    role: raw.role === "assistant" ? "assistant" : "user",
    content: raw.content,
    targetNodeKey,
    suggestion: raw.suggestion ?? undefined,
    followUps,
    createdAt: raw.createdAt.toISOString()
  };
}

function fallbackEvaluationReport(summary: string, suggestions: string[]): AIEvaluationReport {
  return {
    ideaSummary: summary,
    problem: "저장된 평가에 구조화된 문제 분석이 없어 기존 요약을 기준으로 확인해야 합니다.",
    solution: "저장된 평가에 구조화된 해결 방법 분석이 없어 화이트보드와 아이디어 본문을 함께 확인해야 합니다.",
    mvp: "화이트보드의 MVP 노드와 검증 계획을 기준으로 첫 버전 범위를 다시 정리하세요.",
    developmentPlan: [
      "핵심 사용자 흐름을 정리합니다.",
      "MVP 기능을 가장 작은 검증 단위로 줄입니다.",
      "AI 평가 결과와 사용자 인터뷰를 비교합니다."
    ],
    marketAnalysis: suggestions[0] ?? "시장성은 타깃 사용자의 반복 문제와 지불 의사로 검증해야 합니다.",
    targetAudience: suggestions[1] ?? "초기 타깃 사용자를 더 좁게 정의해야 합니다.",
    keyRisks: suggestions.length ? suggestions.slice(0, 3) : ["타깃, 수익 모델, 검증 계획이 추상적일 수 있습니다."]
  };
}

function parseStoredEvaluationPayload(value: unknown, summary: string) {
  if (Array.isArray(value)) {
    const suggestions = value.filter((item): item is string => typeof item === "string");
    return {
      suggestions,
      report: fallbackEvaluationReport(summary, suggestions)
    };
  }

  if (value && typeof value === "object") {
    const payload = value as { items?: unknown; report?: unknown };
    const suggestions = Array.isArray(payload.items) ? payload.items.filter((item): item is string => typeof item === "string") : [];
    const report = payload.report && typeof payload.report === "object" ? (payload.report as AIEvaluationReport) : fallbackEvaluationReport(summary, suggestions);
    return {
      suggestions,
      report: {
        ...fallbackEvaluationReport(summary, suggestions),
        ...report
      }
    };
  }

  return {
    suggestions: [],
    report: fallbackEvaluationReport(summary, [])
  };
}

function serializeEvaluation(raw: {
  ideaId: string;
  overallScore: number;
  scores: unknown;
  summary: string;
  suggestions: unknown;
  createdAt: Date;
}): AIEvaluation {
  const payload = parseStoredEvaluationPayload(raw.suggestions, raw.summary);
  return {
    ideaId: raw.ideaId,
    overallScore: raw.overallScore,
    scores: raw.scores as AIEvaluation["scores"],
    summary: raw.summary,
    suggestions: payload.suggestions,
    report: payload.report,
    createdAt: raw.createdAt.toISOString()
  };
}

async function getUnlockedIds(userId: string | null, ideaIds: string[]) {
  if (!userId || ideaIds.length === 0) {
    return new Set<string>();
  }

  const unlocks = await prisma.ideaUnlock.findMany({
    where: { userId, ideaId: { in: ideaIds } },
    select: { ideaId: true }
  });
  return new Set(unlocks.map((unlock) => unlock.ideaId));
}

async function assertIdeaOwner(ideaId: string, userId: string) {
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) {
    throw new AppError(404, "NOT_FOUND", "아이디어를 찾을 수 없습니다.");
  }
  if (idea.authorId !== userId) {
    throw new AppError(403, "FORBIDDEN", "작성자만 수정할 수 있습니다.");
  }
  return idea;
}

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const tabInput = typeof req.query.tab === "string" ? req.query.tab : "recommended";
    const tab = feedTabSchema.safeParse(tabInput).success ? feedTabSchema.parse(tabInput) : "recommended";
    const limit = Math.min(Number(req.query.limit ?? 20), 40);

    if (tab === "following") {
      return ok(res, []);
    }

    const where = category && categorySchema.safeParse(category).success ? { category: category as Category } : {};
    const orderBy: Prisma.IdeaOrderByWithRelationInput[] =
      tab === "latest" ? [{ createdAt: "desc" }] : [{ likeCount: "desc" }, { createdAt: "desc" }];

    const ideas = await prisma.idea.findMany({
      where,
      include: { author: true },
      orderBy,
      take: limit
    });

    const unlockedIds = await getUnlockedIds(
      req.user?.id ?? null,
      ideas.map((idea) => idea.id)
    );

    return ok(
      res,
      ideas.map((idea) => serializeCard(idea, req.user?.id ?? null, unlockedIds))
    );
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = getUserId(req);
    const input = createIdeaSchema.parse(req.body);

    const ideaId = await prisma.$transaction(async (tx) => {
      const created = await tx.idea.create({
        data: {
          title: input.title,
          oneLine: input.oneLine,
          problem: input.problem,
          solution: input.solution,
          category: input.category,
          coverImageUrl: input.coverImageUrl ?? null,
          authorId: userId,
          whiteboard: {
            create: {
              nodes: asJson(defaultWhiteboardPayload())
            }
          }
        },
        include: { author: true }
      });

      await addPoints(tx, {
        userId,
        ideaId: created.id,
        action: "IDEA_CREATE",
        reason: "아이디어 작성"
      });

      return created.id;
    });

    const idea = await prisma.idea.findUniqueOrThrow({
      where: { id: ideaId },
      include: { author: true }
    });

    return ok(res, serializeDetail(idea, userId, new Set([idea.id])), undefined, 201);
  })
);

router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const ideaId = getParamId(req);
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { author: true }
    });
    if (!idea) {
      throw new AppError(404, "NOT_FOUND", "아이디어를 찾을 수 없습니다.");
    }

    const unlockedIds = await getUnlockedIds(req.user?.id ?? null, [idea.id]);
    return ok(res, serializeDetail(idea, req.user?.id ?? null, unlockedIds));
  })
);

router.get(
  "/:id/comments",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const ideaId = getParamId(req);
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { id: true }
    });
    if (!idea) {
      throw new AppError(404, "NOT_FOUND", "아이디어를 찾을 수 없습니다.");
    }

    const comments = await prisma.ideaComment.findMany({
      where: { ideaId },
      include: {
        author: {
          select: {
            username: true,
            profileImageUrl: true
          }
        }
      },
      orderBy: { createdAt: "asc" },
      take: 100
    });

    return ok(res, comments.map(serializeComment));
  })
);

router.post(
  "/:id/comments",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const ideaId = getParamId(req);
    const userId = getUserId(req);
    const input = createCommentSchema.parse(req.body);

    const comment = await prisma.$transaction(async (tx) => {
      const idea = await tx.idea.findUnique({
        where: { id: ideaId },
        select: { id: true }
      });
      if (!idea) {
        throw new AppError(404, "NOT_FOUND", "아이디어를 찾을 수 없습니다.");
      }

      const created = await tx.ideaComment.create({
        data: {
          ideaId,
          authorId: userId,
          content: input.content
        },
        include: {
          author: {
            select: {
              username: true,
              profileImageUrl: true
            }
          }
        }
      });

      await tx.idea.update({
        where: { id: ideaId },
        data: { commentCount: { increment: 1 } }
      });

      await addPoints(tx, {
        userId,
        ideaId,
        action: "COMMENT_WRITE",
        reason: "댓글 작성"
      });

      return created;
    });

    return ok(res, serializeComment(comment), undefined, 201);
  })
);

router.post(
  "/:id/unlock",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const ideaId = getParamId(req);
    const userId = getUserId(req);
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { author: true }
    });
    if (!idea) {
      throw new AppError(404, "NOT_FOUND", "아이디어를 찾을 수 없습니다.");
    }

    if (idea.authorId !== userId) {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.ideaUnlock.findUnique({
          where: { userId_ideaId: { userId, ideaId: idea.id } }
        });
        if (existing) {
          return;
        }

        await spendPoints(tx, {
          userId,
          ideaId: idea.id,
          action: "IDEA_UNLOCK",
          reason: "아이디어 잠금 해제"
        });
        await tx.ideaUnlock.create({
          data: { userId, ideaId: idea.id }
        });
      });
    }

    return ok(res, serializeDetail(idea, userId, new Set([idea.id])));
  })
);

router.post(
  "/:id/like",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const ideaId = getParamId(req);
    const userId = getUserId(req);

    const likedIdea = await prisma.$transaction(async (tx) => {
      const idea = await tx.idea.findUnique({
        where: { id: ideaId },
        include: { author: true }
      });
      if (!idea) {
        throw new AppError(404, "NOT_FOUND", "아이디어를 찾을 수 없습니다.");
      }
      if (idea.authorId === userId) {
        throw new AppError(409, "CONFLICT", "자기 아이디어에는 좋아요를 누를 수 없습니다.");
      }

      const existing = await tx.ideaLike.findUnique({
        where: { userId_ideaId: { userId, ideaId } }
      });
      if (existing) {
        return idea;
      }

      await tx.ideaLike.create({
        data: { userId, ideaId }
      });

      const updated = await tx.idea.update({
        where: { id: ideaId },
        data: { likeCount: { increment: 1 } },
        include: { author: true }
      });

      await addPoints(tx, {
        userId: updated.authorId,
        ideaId: updated.id,
        action: "LIKE_RECEIVED",
        reason: "좋아요 받음"
      });

      return updated;
    });

    const unlockedIds = await getUnlockedIds(userId, [likedIdea.id]);
    return ok(res, serializeCard(likedIdea, userId, unlockedIds));
  })
);

router.get(
  "/:id/whiteboard",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const ideaId = getParamId(req);
    const userId = getUserId(req);
    await assertIdeaOwner(ideaId, userId);
    const board = await prisma.whiteboard.upsert({
      where: { ideaId },
      update: {},
      create: {
        ideaId,
        nodes: asJson(defaultWhiteboardPayload())
      }
    });

    return ok(res, serializeWhiteboard(board));
  })
);

router.put(
  "/:id/whiteboard",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const ideaId = getParamId(req);
    const userId = getUserId(req);
    await assertIdeaOwner(ideaId, userId);
    const input = whiteboardSchema.parse(req.body);
    const payload = {
      nodes: normalizeWhiteboardNodes(input.nodes),
      edges: input.edges ?? defaultEdges,
      viewport: input.viewport ?? defaultViewport
    };
    const board = await prisma.whiteboard.upsert({
      where: { ideaId },
      update: { nodes: asJson(payload) },
      create: {
        ideaId,
        nodes: asJson(payload)
      }
    });

    return ok(res, serializeWhiteboard(board));
  })
);

router.get(
  "/:id/whiteboard/assistant/messages",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const ideaId = getParamId(req);
    const userId = getUserId(req);
    await assertIdeaOwner(ideaId, userId);
    const messages = await prisma.whiteboardAssistantMessage.findMany({
      where: { ideaId },
      orderBy: { createdAt: "asc" },
      take: 80
    });

    return ok(res, messages.map(serializeAssistantMessage));
  })
);

router.post(
  "/:id/whiteboard/assistant",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const ideaId = getParamId(req);
    const userId = getUserId(req);
    const idea = await assertIdeaOwner(ideaId, userId);
    const input = whiteboardAssistantSchema.parse(req.body);
    const savedBoard = await prisma.whiteboard.findUnique({ where: { ideaId } });
    const storedHistory = await prisma.whiteboardAssistantMessage.findMany({
      where: { ideaId },
      orderBy: { createdAt: "asc" },
      take: 80
    });
    const history = storedHistory.length ? storedHistory.map(serializeAssistantMessage) : input.history;
    const whiteboard = input.board
      ? {
          ideaId,
          updatedAt: input.board.updatedAt ?? new Date().toISOString(),
          nodes: normalizeWhiteboardNodes(input.board.nodes),
          edges: input.board.edges ?? defaultEdges,
          viewport: input.board.viewport ?? defaultViewport
        }
      : savedBoard
        ? serializeWhiteboard(savedBoard)
        : {
            ideaId,
            updatedAt: new Date().toISOString(),
            ...defaultWhiteboardPayload()
          };

    const detail = await serializeOwnIdeaDetail(idea);
    const response = await generateWhiteboardAssistant(detail, whiteboard, {
      message: input.message,
      targetNodeKey: input.targetNodeKey,
      board: whiteboard,
      history
    });
    const savedMessages = await prisma.$transaction(
      response.messages.map((message) =>
        prisma.whiteboardAssistantMessage.create({
          data: {
            ideaId,
            role: message.role,
            content: message.content,
            targetNodeKey: message.targetNodeKey,
            suggestion: message.suggestion,
            followUps: message.followUps ? asJson(message.followUps) : undefined,
            createdAt: new Date(message.createdAt)
          }
        })
      )
    );

    return ok(res, {
      ...response,
      messages: savedMessages.map(serializeAssistantMessage)
    });
  })
);

router.get(
  "/:id/ai/evaluation",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const ideaId = getParamId(req);
    const userId = getUserId(req);
    await assertIdeaOwner(ideaId, userId);
    const evaluation = await prisma.aIEvaluation.findUnique({ where: { ideaId } });
    return ok(res, evaluation ? serializeEvaluation(evaluation) : null);
  })
);

router.post(
  "/:id/ai/evaluate",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const ideaId = getParamId(req);
    const userId = getUserId(req);
    const idea = await assertIdeaOwner(ideaId, userId);
    const author = await prisma.user.findUniqueOrThrow({ where: { id: idea.authorId } });
    const board = await prisma.whiteboard.findUnique({ where: { ideaId: idea.id } });

    const detail: IdeaDetail = {
      id: idea.id,
      title: idea.title,
      oneLine: idea.oneLine,
      category: idea.category as Category,
      coverImageUrl: idea.coverImageUrl,
      authorName: author.username,
      likeCount: idea.likeCount,
      commentCount: idea.commentCount,
      unlockCost: idea.unlockCost,
      isUnlocked: true,
      createdAt: idea.createdAt.toISOString(),
      problem: idea.problem,
      solution: idea.solution
    };

    const whiteboard = board ? serializeWhiteboard(board) : null;
    const generated = await evaluateIdea(detail, whiteboard);
    const evaluationPayload = {
      items: generated.suggestions,
      report: generated.report
    };

    const saved = await prisma.$transaction(async (tx) => {
      await spendPoints(tx, {
        userId,
        ideaId: idea.id,
        action: "AI_EVALUATE",
        reason: "AI 평가"
      });

      return tx.aIEvaluation.upsert({
        where: { ideaId: idea.id },
        update: {
          overallScore: generated.overallScore,
          scores: asJson(generated.scores),
          summary: generated.summary,
          suggestions: asJson(evaluationPayload)
        },
        create: {
          ideaId: idea.id,
          overallScore: generated.overallScore,
          scores: asJson(generated.scores),
          summary: generated.summary,
          suggestions: asJson(evaluationPayload)
        }
      });
    });

    return ok(res, serializeEvaluation(saved));
  })
);

export { router as ideasRouter };
