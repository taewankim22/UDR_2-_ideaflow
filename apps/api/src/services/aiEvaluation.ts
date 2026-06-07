import type { AIEvaluation, AIEvaluationReport, IdeaDetail, Whiteboard, WhiteboardNodeKey } from "@ideaflow/shared/types";
import { env } from "../env.js";
import { AppError } from "../lib/appError.js";

function clampScore(value: number) {
  return Math.max(35, Math.min(95, Math.round(value)));
}

function nodeContent(whiteboard: Whiteboard | null, key: WhiteboardNodeKey, fallback: string) {
  return whiteboard?.nodes.find((node) => node.key === key)?.content.trim() || fallback;
}

function fallbackReport(idea: IdeaDetail, whiteboard: Whiteboard | null): AIEvaluationReport {
  const target = nodeContent(whiteboard, "targetUser", "초기 타깃 사용자를 더 구체화해야 합니다.");
  const alternatives = nodeContent(whiteboard, "currentAlternatives", "현재 대안과 전환 장벽을 확인해야 합니다.");
  const mvp = nodeContent(whiteboard, "validationPlan", "핵심 입력, AI 제안 확인, 저장까지의 한 사이클을 MVP로 제안합니다.");
  const revenue = nodeContent(whiteboard, "revenueModel", "무료 체험 후 구독 또는 크레딧 과금을 먼저 검증해볼 수 있습니다.");

  return {
    ideaSummary: `${idea.title}은 ${idea.oneLine}`,
    problem: nodeContent(whiteboard, "problemContext", idea.problem),
    solution: nodeContent(whiteboard, "solutionConcept", idea.solution),
    mvp,
    developmentPlan: [
      "핵심 사용자 흐름을 로그인, 아이디어 작성, 화이트보드 작성, AI 평가 실행으로 고정합니다.",
      "화이트보드 7개 core node의 저장/불러오기와 Assistant 제안 적용을 안정화합니다.",
      "AI 평가 결과를 점수, 리포트, 개선 제안으로 분리해 반복 실행 가능하게 만듭니다.",
      "5명 내외의 초기 사용자에게 MVP를 보여주고 재사용 의향과 지불 의사를 검증합니다."
    ],
    marketAnalysis: `${target}가 이미 겪는 반복 문제인지, ${alternatives} 대비 전환할 만큼 시간이 줄어드는지가 초기 시장성의 핵심입니다.`,
    targetAudience: target,
    keyRisks: [
      "타깃 사용자가 너무 넓으면 첫 MVP의 가치가 흐려질 수 있습니다.",
      "AI 제안 품질이 기대보다 낮으면 사용자가 결과를 신뢰하지 않을 수 있습니다.",
      `${revenue}를 실제 지불 의사로 검증하지 않으면 수익성 판단이 늦어질 수 있습니다.`
    ]
  };
}

function normalizeReport(value: unknown, idea: IdeaDetail, whiteboard: Whiteboard | null): AIEvaluationReport {
  const fallback = fallbackReport(idea, whiteboard);
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Partial<AIEvaluationReport>;

  return {
    ideaSummary: raw.ideaSummary || fallback.ideaSummary,
    problem: raw.problem || fallback.problem,
    solution: raw.solution || fallback.solution,
    mvp: raw.mvp || fallback.mvp,
    developmentPlan: Array.isArray(raw.developmentPlan) && raw.developmentPlan.length ? raw.developmentPlan.slice(0, 6) : fallback.developmentPlan,
    marketAnalysis: raw.marketAnalysis || fallback.marketAnalysis,
    targetAudience: raw.targetAudience || fallback.targetAudience,
    keyRisks: Array.isArray(raw.keyRisks) && raw.keyRisks.length ? raw.keyRisks.slice(0, 5) : fallback.keyRisks
  };
}

function normalizeEvaluation(value: Partial<AIEvaluation>, idea: IdeaDetail, whiteboard: Whiteboard | null): AIEvaluation {
  const fallback = mockEvaluation(idea, whiteboard);
  const scores = value.scores ?? fallback.scores;
  const overallScore =
    typeof value.overallScore === "number"
      ? clampScore(value.overallScore)
      : Math.round((scores.market + scores.feasibility + scores.profitability + scores.differentiation + scores.growth) / 5);

  return {
    ideaId: idea.id,
    overallScore,
    scores: {
      market: clampScore(scores.market),
      feasibility: clampScore(scores.feasibility),
      profitability: clampScore(scores.profitability),
      differentiation: clampScore(scores.differentiation),
      growth: clampScore(scores.growth)
    },
    summary: value.summary || fallback.summary,
    suggestions: Array.isArray(value.suggestions) && value.suggestions.length ? value.suggestions.slice(0, 6) : fallback.suggestions,
    report: normalizeReport(value.report, idea, whiteboard),
    createdAt: new Date().toISOString()
  };
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
    (scores.market + scores.feasibility + scores.profitability + scores.differentiation + scores.growth) / 5
  );

  return {
    ideaId: idea.id,
    overallScore,
    scores,
    summary: `${idea.title}은 문제 정의와 실행 가능성이 비교적 선명합니다. MVP에서는 타깃 사용자의 반복 빈도와 지불 의사를 가장 먼저 검증해야 합니다.`,
    suggestions: [
      "초기 사용자를 하나의 좁은 집단으로 줄이고 인터뷰 질문을 5개 이하로 정리하세요.",
      "수익 모델과 검증 계획 노드를 구체적인 숫자와 기간으로 채우세요.",
      "첫 MVP는 사용자가 결과를 확인하는 순간까지의 핵심 흐름만 남기세요."
    ],
    report: fallbackReport(idea, whiteboard),
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
                "Required shape: { overallScore, scores, summary, suggestions, report }.",
                "scores keys: market, feasibility, profitability, differentiation, growth. Scores must be integers from 0 to 100.",
                "report keys: ideaSummary, problem, solution, mvp, developmentPlan, marketAnalysis, targetAudience, keyRisks.",
                "developmentPlan and keyRisks must be arrays of concise Korean strings.",
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

    const parsed = JSON.parse(response.text ?? "{}") as Partial<AIEvaluation>;
    return normalizeEvaluation(parsed, idea, whiteboard);
  } catch (error) {
    console.error(error);
    throw new AppError(503, "AI_UNAVAILABLE", "AI 평가를 완료하지 못했습니다.");
  }
}
