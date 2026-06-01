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
  EDU: ["#교육", "#학습", "#노트"],
  TRAVEL: ["#여행", "#플래너", "#추천"],
  ENV: ["#환경", "#ESG", "#순환"],
  HEALTH: ["#헬스", "#습관", "#케어"],
  ETC: ["#아이디어", "#MVP", "#실험"]
};

export const boardOrder: WhiteboardNodeKey[] = [
  "problemContext",
  "solutionConcept",
  "targetUser",
  "coreValue",
  "validationPlan",
  "revenueModel",
  "currentAlternatives"
];

export const nodeTheme: Record<
  WhiteboardNodeKey,
  { label: string; shell: string; accent: string; grid: string; helper: string }
> = {
  problemContext: {
    label: "문제",
    shell: "bg-amber-50 border-amber-200",
    accent: "text-amber-700",
    grid: "lg:col-start-1 lg:row-start-1",
    helper: "어떤 불편함이 반복되나요?"
  },
  targetUser: {
    label: "타겟 사용자",
    shell: "bg-violet-50 border-violet-200",
    accent: "text-violet-700",
    grid: "lg:col-start-1 lg:row-start-2",
    helper: "가장 먼저 쓸 사람을 좁혀보세요."
  },
  solutionConcept: {
    label: "해결 방법",
    shell: "bg-lime-50 border-lime-200",
    accent: "text-lime-700",
    grid: "lg:col-start-3 lg:row-start-1",
    helper: "핵심 해결 흐름을 적어주세요."
  },
  coreValue: {
    label: "핵심 기능",
    shell: "bg-sky-50 border-sky-200",
    accent: "text-sky-700",
    grid: "lg:col-start-2 lg:row-start-2",
    helper: "사용자가 매일 만질 기능은 무엇인가요?"
  },
  validationPlan: {
    label: "MVP",
    shell: "bg-yellow-50 border-yellow-200",
    accent: "text-yellow-700",
    grid: "lg:col-start-2 lg:row-start-3",
    helper: "첫 버전의 최소 범위를 정하세요."
  },
  revenueModel: {
    label: "수익 모델",
    shell: "bg-rose-50 border-rose-200",
    accent: "text-rose-700",
    grid: "lg:col-start-1 lg:row-start-4",
    helper: "누가 언제 돈을 내나요?"
  },
  currentAlternatives: {
    label: "리스크",
    shell: "bg-red-50 border-red-200",
    accent: "text-red-700",
    grid: "lg:col-start-3 lg:row-start-4",
    helper: "실패 요인을 미리 적어주세요."
  }
};

export function getCoverStyle(idea: Pick<IdeaCard, "category" | "coverImageUrl">): CSSProperties {
  if (idea.coverImageUrl) {
    return { backgroundImage: `url(${idea.coverImageUrl})` };
  }

  const gradients: Record<Category, string> = {
    AI: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.85), transparent 26%), linear-gradient(135deg, #6C4CF1, #21B6FF)",
    EDU: "radial-gradient(circle at 85% 20%, rgba(255,255,255,.9), transparent 24%), linear-gradient(135deg, #8B5CF6, #F59E0B)",
    TRAVEL:
      "radial-gradient(circle at 25% 25%, rgba(255,255,255,.9), transparent 24%), linear-gradient(135deg, #14B8A6, #3B82F6)",
    ENV: "radial-gradient(circle at 80% 25%, rgba(255,255,255,.86), transparent 26%), linear-gradient(135deg, #22C55E, #0F766E)",
    HEALTH:
      "radial-gradient(circle at 20% 80%, rgba(255,255,255,.8), transparent 24%), linear-gradient(135deg, #F97316, #EC4899)",
    ETC: "radial-gradient(circle at 76% 20%, rgba(255,255,255,.78), transparent 26%), linear-gradient(135deg, #64748B, #6C4CF1)"
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
