import type { AIEvaluation, IdeaDetail, Whiteboard } from "@ideaflow/shared/types";
import { env } from "../env.js";
import { AppError } from "../lib/appError.js";

function clampScore(value: number) {
  return Math.max(35, Math.min(95, Math.round(value)));
}

export function mockEvaluation(idea: IdeaDetail, whiteboard: Whiteboard | null): AIEvaluation {
  const filledNodes = whiteboard?.nodes.filter((node) => node.content.trim().length > 20).length ?? 0;
  const density = Math.min(20, filledNodes * 3);
  const textFactor = Math.min(15, Math.round((idea.problem.length + idea.solution.length) / 90));

  const scores = {
    market: clampScore(58 + density + textFactor),
    feasibility: clampScore(64 + filledNodes * 2),
    profitability: clampScore(55 + textFactor + filledNodes),
    differentiation: clampScore(60 + density),
    growth: clampScore(62 + textFactor)
  };
  const overallScore = Math.round(
    (scores.market +
      scores.feasibility +
      scores.profitability +
      scores.differentiation +
      scores.growth) /
      5
  );

  return {
    ideaId: idea.id,
    overallScore,
    scores,
    summary: `${idea.title}는 문제 정의와 실행 가능성이 비교적 선명합니다. MVP에서는 타깃 사용자의 반복 빈도와 지불 의사를 가장 먼저 검증해야 합니다.`,
    suggestions: [
      "첫 사용자군을 하나로 좁히고 인터뷰 질문을 5개 이하로 정리하세요.",
      "화이트보드의 수익 모델과 검증 계획 노드를 더 구체적인 숫자로 채우세요.",
      "잠금 해제 전에 매력적으로 전달될 수 있도록 한 줄 설명을 더 날카롭게 다듬으세요."
    ],
    createdAt: new Date().toISOString()
  };
}

export async function evaluateIdea(idea: IdeaDetail, whiteboard: Whiteboard | null) {
  if (env.aiMode !== "gemini") {
    return mockEvaluation(idea, whiteboard);
  }

  if (!env.geminiApiKey) {
    throw new AppError(503, "AI_UNAVAILABLE", "Gemini API 키가 설정되지 않았습니다.");
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                "Return only JSON for an IdeaFlow AIEvaluation.",
                "Scores must be integers from 0 to 100.",
                `Idea title: ${idea.title}`,
                `One line: ${idea.oneLine}`,
                `Problem: ${idea.problem}`,
                `Solution: ${idea.solution}`,
                `Whiteboard: ${JSON.stringify(whiteboard?.nodes ?? [])}`
              ].join("\n")
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text ?? "{}") as AIEvaluation;
    return {
      ...parsed,
      ideaId: idea.id,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(error);
    throw new AppError(503, "AI_UNAVAILABLE", "AI 평가를 완료하지 못했습니다.");
  }
}
