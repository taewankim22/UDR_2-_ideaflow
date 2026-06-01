import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { AuthSession, User } from "@ideaflow/shared/types";
import { env } from "../env.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { ok } from "../lib/apiResponse.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { addPoints, ensurePointRules } from "../services/points.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  username: z.string().trim().min(2).max(30).optional(),
  provider: z.enum(["email", "kakao", "google"]).default("email")
});

function serializeUser(user: {
  id: string;
  email: string;
  username: string;
  profileImageUrl: string | null;
  pointsBalance: number;
}): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
    pointsBalance: user.pointsBalance
  };
}

function signSession(user: User): AuthSession {
  return {
    token: jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, { expiresIn: "7d" }),
    user
  };
}

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const normalizedEmail = input.email.toLowerCase();

    const result = await prisma.$transaction(async (tx) => {
      await ensurePointRules(tx);
      const existing = await tx.user.findUnique({ where: { email: normalizedEmail } });

      if (existing) {
        if (input.username && input.username !== existing.username) {
          return tx.user.update({
            where: { id: existing.id },
            data: { username: input.username }
          });
        }

        return existing;
      }

      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          username: input.username || normalizedEmail.split("@")[0] || "Idea Maker",
          authIdentities: {
            create: {
              provider: input.provider,
              providerUserId: normalizedEmail
            }
          }
        }
      });

      await addPoints(tx, {
        userId: user.id,
        action: "SIGNUP_BONUS",
        reason: "가입 보너스"
      });

      return tx.user.findUniqueOrThrow({ where: { id: user.id } });
    });

    return ok(res, signSession(serializeUser(result)));
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    return ok(res, req.user);
  })
);

export { router as authRouter };
