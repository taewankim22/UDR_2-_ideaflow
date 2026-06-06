import { PrismaClient } from "@prisma/client";
import { WHITEBOARD_NODE_DEFINITIONS } from "@ideaflow/shared/types";

const prisma = new PrismaClient();

const pointRules = [
  { action: "SIGNUP_BONUS", delta: 30, label: "가입 보너스" },
  { action: "IDEA_CREATE", delta: 10, label: "아이디어 작성" },
  { action: "COMMENT_WRITE", delta: 3, label: "댓글 작성" },
  { action: "LIKE_RECEIVED", delta: 1, label: "좋아요 받음" },
  { action: "IDEA_UNLOCK", delta: -3, label: "아이디어 잠금 해제" },
  { action: "AI_EVALUATE", delta: -5, label: "AI 평가" }
] as const;

async function main() {
  for (const rule of pointRules) {
    await prisma.pointRule.upsert({
      where: { action: rule.action },
      update: { delta: rule.delta, label: rule.label },
      create: rule
    });
  }

  const user = await prisma.user.upsert({
    where: { email: "demo@ideaflow.local" },
    update: {
      username: "Demo Maker"
    },
    create: {
      email: "demo@ideaflow.local",
      username: "Demo Maker",
      pointsBalance: 40,
      authIdentities: {
        create: {
          provider: "email",
          providerUserId: "demo@ideaflow.local"
        }
      }
    }
  });

  const idea = await prisma.idea.upsert({
    where: { id: "seed-ai-study" },
    update: {
      title: "수업 노트 자동 요약 보드",
      oneLine: "강의 내용을 고정 질문 7개로 정리해 복습 흐름을 만드는 서비스",
      category: "EDU",
      problem:
        "학생들이 강의 직후 핵심 개념과 미해결 질문을 놓치고, 시험 직전에 다시 정리하느라 시간을 많이 씁니다.",
      solution:
        "녹음과 메모를 받아 7개 화이트보드 노드로 자동 정리하고, 사용자가 빈칸을 보완하게 합니다.",
      unlockCost: 3
    },
    create: {
      id: "seed-ai-study",
      title: "수업 노트 자동 요약 보드",
      oneLine: "강의 내용을 고정 질문 7개로 정리해 복습 흐름을 만드는 서비스",
      category: "EDU",
      problem:
        "학생들이 강의 직후 핵심 개념과 미해결 질문을 놓치고, 시험 직전에 다시 정리하느라 시간을 많이 씁니다.",
      solution:
        "녹음과 메모를 받아 7개 화이트보드 노드로 자동 정리하고, 사용자가 빈칸을 보완하게 합니다.",
      authorId: user.id,
      unlockCost: 3
    }
  });

  await prisma.whiteboard.upsert({
    where: { ideaId: idea.id },
    update: {},
    create: {
      ideaId: idea.id,
      nodes: WHITEBOARD_NODE_DEFINITIONS.map((node) => ({
        ...node,
        content: ""
      }))
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
