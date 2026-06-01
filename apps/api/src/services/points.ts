import type { Prisma, PrismaClient } from "@prisma/client";
import type { PointAction, PointLedgerEntry, PointRule } from "@ideaflow/shared/types";
import { AppError } from "../lib/appError.js";

type DbClient = PrismaClient | Prisma.TransactionClient;

export const POINT_RULES: PointRule[] = [
  { action: "SIGNUP_BONUS", delta: 30, label: "가입 보너스" },
  { action: "IDEA_CREATE", delta: 10, label: "아이디어 작성" },
  { action: "IDEA_UNLOCK", delta: -3, label: "아이디어 잠금 해제" },
  { action: "AI_EVALUATE", delta: -5, label: "AI 평가" }
];

export function getRule(action: PointAction) {
  const rule = POINT_RULES.find((item) => item.action === action);
  if (!rule) {
    throw new AppError(400, "VALIDATION_ERROR", "존재하지 않는 포인트 규칙입니다.");
  }
  return rule;
}

export async function ensurePointRules(db: DbClient) {
  await Promise.all(
    POINT_RULES.map((rule) =>
      db.pointRule.upsert({
        where: { action: rule.action },
        update: { delta: rule.delta, label: rule.label },
        create: rule
      })
    )
  );
}

export async function addPoints(
  db: DbClient,
  params: {
    userId: string;
    action: Extract<PointAction, "SIGNUP_BONUS" | "IDEA_CREATE">;
    reason: string;
    ideaId?: string;
  }
) {
  const rule = getRule(params.action);
  const user = await db.user.update({
    where: { id: params.userId },
    data: { pointsBalance: { increment: rule.delta } }
  });

  return db.pointTransaction.create({
    data: {
      userId: params.userId,
      ideaId: params.ideaId,
      action: params.action,
      delta: rule.delta,
      balanceAfter: user.pointsBalance,
      reason: params.reason
    }
  });
}

export async function spendPoints(
  db: DbClient,
  params: {
    userId: string;
    action: Extract<PointAction, "IDEA_UNLOCK" | "AI_EVALUATE">;
    reason: string;
    ideaId?: string;
  }
) {
  const rule = getRule(params.action);
  const cost = Math.abs(rule.delta);
  const updated = await db.user.updateMany({
    where: {
      id: params.userId,
      pointsBalance: { gte: cost }
    },
    data: {
      pointsBalance: { decrement: cost }
    }
  });

  if (updated.count !== 1) {
    throw new AppError(402, "INSUFFICIENT_POINTS", "포인트가 부족합니다.");
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: params.userId } });
  return db.pointTransaction.create({
    data: {
      userId: params.userId,
      ideaId: params.ideaId,
      action: params.action,
      delta: rule.delta,
      balanceAfter: user.pointsBalance,
      reason: params.reason
    }
  });
}

export function serializePointTransaction(item: {
  id: string;
  action: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  createdAt: Date;
}): PointLedgerEntry {
  return {
    id: item.id,
    action: item.action as PointAction,
    delta: item.delta,
    balanceAfter: item.balanceAfter,
    reason: item.reason,
    createdAt: item.createdAt.toISOString()
  };
}
