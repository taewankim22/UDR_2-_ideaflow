import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  WHITEBOARD_NODE_DEFINITIONS,
  WHITEBOARD_NODE_KEYS,
  type AIEvaluation,
  type Category,
  type CreateIdeaRequest,
  type IdeaCard,
  type IdeaDetail,
  type UpdateWhiteboardRequest,
  type Whiteboard,
  type WhiteboardNode
} from "@ideaflow/shared/types";
import { asyncHandler } from "../lib/asyncHandler.js";
import { ok } from "../lib/apiResponse.js";
import { AppError } from "../lib/appError.js";
import { prisma } from "../lib/prisma.js";
import { optionalAuth, requireAuth, type AuthRequest } from "../middleware/auth.js";
import { evaluateIdea } from "../services/aiEvaluation.js";
import { addPoints, spendPoints } from "../services/points.js";

const router = Router();

const categorySchema = z.enum(["AI", "EDU", "TRAVEL", "ENV", "HEALTH", "ETC"]);
const feedTabSchema = z.enum(["recommended", "latest", "following"]);
const createIdeaSchema = z.object({
  title: z.string().trim().min(2).max(80),
  oneLine: z.string().trim().min(5).max(140),
  problem: z.string().trim().min(10).max(2000),
  solution: z.string().trim().min(10).max(2000),
  category: categorySchema,
  coverImageUrl: z.string().url().nullable().optional()
}) satisfies z.ZodType<CreateIdeaRequest>;

const whiteboardNodeSchema = z.object({
  key: z.enum(WHITEBOARD_NODE_KEYS),
  label: z.string().trim().min(1).max(30),
  content: z.string().max(1600)
});

const whiteboardSchema = z.object({
  nodes: z.array(whiteboardNodeSchema).length(7)
}) satisfies z.ZodType<UpdateWhiteboardRequest>;

function defaultWhiteboardNodes(): WhiteboardNode[] {
  return WHITEBOARD_NODE_DEFINITIONS.map((node) => ({ ...node, content: "" }));
}

function normalizeWhiteboardNodes(nodes: WhiteboardNode[]): WhiteboardNode[] {
  const byKey = new Map(nodes.map((node) => [node.key, node.content] as const));
  return WHITEBOARD_NODE_DEFINITIONS.map((node) => ({
    ...node,
    content: byKey.get(node.key)?.trim() ?? ""
  }));
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

function serializeWhiteboard(raw: { ideaId: string; nodes: unknown; updatedAt: Date }): Whiteboard {
  return {
    ideaId: raw.ideaId,
    updatedAt: raw.updatedAt.toISOString(),
    nodes: normalizeWhiteboardNodes(raw.nodes as WhiteboardNode[])
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
  return {
    ideaId: raw.ideaId,
    overallScore: raw.overallScore,
    scores: raw.scores as AIEvaluation["scores"],
    summary: raw.summary,
    suggestions: raw.suggestions as string[],
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
              nodes: asJson(defaultWhiteboardNodes())
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
        nodes: asJson(defaultWhiteboardNodes())
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
    const nodes = normalizeWhiteboardNodes(input.nodes);
    const board = await prisma.whiteboard.upsert({
      where: { ideaId },
      update: { nodes: asJson(nodes) },
      create: {
        ideaId,
        nodes: asJson(nodes)
      }
    });

    return ok(res, serializeWhiteboard(board));
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
          suggestions: asJson(generated.suggestions)
        },
        create: {
          ideaId: idea.id,
          overallScore: generated.overallScore,
          scores: asJson(generated.scores),
          summary: generated.summary,
          suggestions: asJson(generated.suggestions)
        }
      });
    });

    return ok(res, serializeEvaluation(saved));
  })
);

export { router as ideasRouter };
