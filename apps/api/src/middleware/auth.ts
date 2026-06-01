import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { User } from "@ideaflow/shared/types";
import { env } from "../env.js";
import { AppError } from "../lib/appError.js";
import { prisma } from "../lib/prisma.js";

export interface AuthRequest extends Request {
  user?: User;
}

interface TokenPayload {
  sub: string;
  email: string;
}

function readBearerToken(req: Request) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length);
}

async function loadUserFromToken(token: string): Promise<User | null> {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      profileImageUrl: user.profileImageUrl,
      pointsBalance: user.pointsBalance
    };
  } catch {
    return null;
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = readBearerToken(req);
  if (token) {
    req.user = (await loadUserFromToken(token)) ?? undefined;
  }
  next();
}

export async function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = readBearerToken(req);
  if (!token) {
    next(new AppError(401, "UNAUTHORIZED", "로그인이 필요합니다."));
    return;
  }

  const user = await loadUserFromToken(token);
  if (!user) {
    next(new AppError(401, "UNAUTHORIZED", "유효하지 않은 로그인 세션입니다."));
    return;
  }

  req.user = user;
  next();
}
