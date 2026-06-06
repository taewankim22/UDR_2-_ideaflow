import type { CSSProperties } from "react";
import type { Category, IdeaCard, WhiteboardNodeKey } from "@ideaflow/shared/types";

export const categoryLabels: Record<Category, string> = {
  AI: "AI",
  EDU: "교육",
  TRAVEL: "여행",
  ENV: "환경",
  HEALTH: "헬스",
  ETC: "기타"
};

export const categoryTags: Record<Category, string[]> = {
  AI: ["#AI", "#자동화", "#분석"],
  EDU: ["#교육", "#학습", "#멘토링"],
  TRAVEL: ["#여행", "#플래너", "#추천"],
  ENV: ["#환경", "#ESG", "#순환"],
  HEALTH: ["#헬스", "#습관", "#케어"],
  ETC: ["#아이디어", "#MVP", "#실험"]
};

export const boardOrder: WhiteboardNodeKey[] = [
  "problemContext",
  "targetUser",
  "currentAlternatives",
  "solutionConcept",
  "coreValue",
  "revenueModel",
  "validationPlan"
];

export const nodeTheme: Record<
  WhiteboardNodeKey,
  { label: string; shell: string; accent: string; grid: string; helper: string }
> = {
  problemContext: {
    label: "문제",
    shell: "bg-amber-50 border-amber-200",
    accent: "text-amber-700",
    grid: "",
    helper: "어떤 불편함이 반복되나요?"
  },
  targetUser: {
    label: "타깃",
    shell: "bg-violet-50 border-violet-200",
    accent: "text-violet-700",
    grid: "",
    helper: "가장 먼저 쓸 사람을 좁혀 보세요."
  },
  currentAlternatives: {
    label: "대안",
    shell: "bg-red-50 border-red-200",
    accent: "text-red-700",
    grid: "",
    helper: "지금은 무엇으로 해결하고 있나요?"
  },
  solutionConcept: {
    label: "해결",
    shell: "bg-lime-50 border-lime-200",
    accent: "text-lime-700",
    grid: "",
    helper: "핵심 해결 흐름을 적어 주세요."
  },
  coreValue: {
    label: "가치",
    shell: "bg-sky-50 border-sky-200",
    accent: "text-sky-700",
    grid: "",
    helper: "사용자가 매일 남기는 이유는?"
  },
  revenueModel: {
    label: "수익",
    shell: "bg-rose-50 border-rose-200",
    accent: "text-rose-700",
    grid: "",
    helper: "누가 언제 돈을 내나요?"
  },
  validationPlan: {
    label: "MVP",
    shell: "bg-yellow-50 border-yellow-200",
    accent: "text-yellow-700",
    grid: "",
    helper: "첫 버전의 최소 범위를 정해 보세요."
  }
};

export function getCoverStyle(idea: Pick<IdeaCard, "category" | "coverImageUrl">): CSSProperties {
  if (idea.coverImageUrl) {
    return { backgroundImage: `url(${idea.coverImageUrl})` };
  }

  const gradients: Record<Category, string> = {
    AI: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    EDU: "linear-gradient(135deg, #7c3aed, #f59e0b)",
    TRAVEL: "linear-gradient(135deg, #0d9488, #2563eb)",
    ENV: "linear-gradient(135deg, #16a34a, #0f766e)",
    HEALTH: "linear-gradient(135deg, #ea580c, #db2777)",
    ETC: "linear-gradient(135deg, #475569, #4f46e5)"
  };

  return { backgroundImage: gradients[idea.category] };
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function formatPoint(delta: number) {
  return `${delta > 0 ? "+" : ""}${delta}P`;
}
