import { Router } from "express";
import type { PointSummary } from "@ideaflow/shared/types";
import { asyncHandler } from "../lib/asyncHandler.js";
import { ok } from "../lib/apiResponse.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { POINT_RULES, serializePointTransaction } from "../services/points.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user?.id } });
    const transactions = await prisma.pointTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30
    });

    const summary: PointSummary = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
        pointsBalance: user.pointsBalance
      },
      rules: POINT_RULES,
      transactions: transactions.map(serializePointTransaction)
    };

    return ok(res, summary);
  })
);

export { router as pointsRouter };
