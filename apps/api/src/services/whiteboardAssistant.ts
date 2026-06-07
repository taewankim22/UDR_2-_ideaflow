import {
  WHITEBOARD_NODE_DEFINITIONS,
  type IdeaDetail,
  type Whiteboard,
  type WhiteboardAssistantMessage,
  type WhiteboardAssistantRequest,
  type WhiteboardAssistantResponse,
  type WhiteboardNodeKey
} from "@ideaflow/shared/types";
import { env } from "../env.js";
import { AppError } from "../lib/appError.js";

const nodeLabels = Object.fromEntries(WHITEBOARD_NODE_DEFINITIONS.map((node) => [node.key, node.label])) as Record<
  WhiteboardNodeKey,
  string
>;

const founderPrinciples = [
  "고객의 고통이 충분히 강한지 먼저 본다. 멋진 기능보다 반복되는 비싼 문제를 찾는다.",
  "타깃을 넓히지 않는다. 지금 당장 돈, 시간, 평판을 잃고 있는 좁은 초기 고객을 찾는다.",
  "솔루션 설명보다 기존 대안과 전환 이유를 더 중요하게 본다.",
  "MVP는 작게 만든다. 기능 묶음이 아니라 가장 위험한 가설 하나를 검증하는 실험으로 정의한다.",
  "성장 가능성은 시장 크기 주장보다 배포 경로, 반복 사용, 지불 의사, 전환 비용으로 판단한다.",
  "칭찬보다 선명한 질문을 우선한다. 사용자가 다음 행동을 하게 만드는 피드백을 준다."
].join("\n");

const nodeFocus: Record<WhiteboardNodeKey, string> = {
  problemContext: "문제를 고객의 손실, 빈도, 현재 임시 해결책으로 다시 정의한다.",
  targetUser: "초기 고객을 하나의 좁은 집단으로 줄이고, 왜 지금 이들이 절박한지 확인한다.",
  currentAlternatives: "고객이 이미 쓰는 대안과 그 대안이 충분하지 않은 이유를 적는다.",
  solutionConcept: "기능 목록이 아니라 고객이 겪는 전후 변화와 핵심 사용 흐름을 설명한다.",
  coreValue: "사용자가 더 빠르게 결정하거나 행동하게 만드는 압도적인 가치를 한 문장으로 만든다.",
  revenueModel: "누가 왜 지불하는지, 첫 가격 실험을 어떻게 할지 정한다.",
  validationPlan: "가장 위험한 가설 하나와 1주 안에 검증할 행동 지표를 정한다."
};

function pickTargetNode(board: Whiteboard, requested?: WhiteboardNodeKey): WhiteboardNodeKey {
  if (requested) return requested;

  const sorted = WHITEBOARD_NODE_DEFINITIONS.map((definition) => ({
    key: definition.key,
    length: board.nodes.find((node) => node.key === definition.key)?.content.trim().length ?? 0
  })).sort((a, b) => a.length - b.length);

  return sorted[0]?.key ?? "problemContext";
}

function boardSnapshot(board: Whiteboard) {
  return WHITEBOARD_NODE_DEFINITIONS.map((definition) => {
    const content = board.nodes.find((node) => node.key === definition.key)?.content.trim();
    return `${definition.key} (${definition.label}): ${content || "(empty)"}`;
  }).join("\n");
}

function suggestionFor(key: WhiteboardNodeKey, idea: IdeaDetail, message: string) {
  const trimmed = message.trim() || idea.oneLine;

  const suggestions: Record<WhiteboardNodeKey, string> = {
    problemContext: `${idea.title}의 문제는 "${trimmed}" 자체가 아니라, 특정 사용자가 이 상황 때문에 반복적으로 잃는 시간, 돈, 기회, 체면입니다. 누가, 언제, 어떤 손실을 겪고, 지금은 어떤 임시방편으로 버티는지 한 문단으로 적어보세요.`,
    targetUser: `초기 타깃은 "${trimmed}"와 관련해 이미 시간이나 돈을 쓰고 있는 좁은 집단으로 줄이세요. 예: 모든 사용자가 아니라 특정 직무, 특정 상황, 특정 예산 압박을 가진 1차 고객.`,
    currentAlternatives: `고객은 이미 무언가를 하고 있습니다. 스프레드시트, 수작업, 기존 SaaS, 지인 조언, 포기 중 무엇을 쓰는지 적고, 그 방식이 왜 충분하지 않은지 비용과 실패 장면으로 설명하세요.`,
    solutionConcept: `${idea.title}의 해결책을 기능 목록으로 쓰지 말고 첫 사용 흐름으로 쓰세요. 사용자가 무엇을 입력하고, AI가 무엇을 판단하며, 사용자가 어떤 더 나은 결정을 내리는지 3단계로 정리하세요.`,
    coreValue: `핵심 가치는 "편리함"보다 강해야 합니다. 사용자가 이 제품을 쓰면 이전보다 얼마나 빨리, 싸게, 확신 있게 행동하는지 한 문장으로 바꾸세요.`,
    revenueModel: `수익 모델은 아직 정답을 고르기보다 첫 지불 실험을 정하세요. 누가 결제권자인지, 왜 무료 대안 대신 돈을 낼지, 첫 가격을 어떻게 물어볼지 적으세요.`,
    validationPlan: `MVP는 1주 안에 가장 위험한 가설 하나만 검증해야 합니다. 기능은 최소화하고, 5명 인터뷰 또는 3명 유료 파일럿처럼 성공/실패가 드러나는 행동 지표를 적으세요.`
  };

  return suggestions[key];
}

function founderFollowUps(targetNodeKey: WhiteboardNodeKey) {
  const specific: Record<WhiteboardNodeKey, string> = {
    problemContext: "이 문제가 오늘도 발생했다는 증거를 고객 행동에서 어떻게 확인할 수 있나요?",
    targetUser: "가장 먼저 돈이나 시간을 쓸 가능성이 높은 10명은 누구인가요?",
    currentAlternatives: "고객이 지금 쓰는 대안이 불편해도 계속 쓰이는 이유는 무엇인가요?",
    solutionConcept: "첫 사용자가 제품을 켠 뒤 3분 안에 얻어야 하는 결과는 무엇인가요?",
    coreValue: "이 제품이 없으면 사용자가 다시 예전 방식으로 돌아갈 만큼 중요한 가치는 무엇인가요?",
    revenueModel: "첫 결제 실험에서 어떤 가격과 문장으로 지불 의사를 물어볼 건가요?",
    validationPlan: "이번 주 안에 실패를 판정할 수 있는 가장 작은 실험은 무엇인가요?"
  };

  return [
    specific[targetNodeKey],
    "이 아이디어가 nice-to-have가 아니라 must-have라는 가장 강한 증거는 무엇인가요?",
    "지금 보드에서 사실이 아니라 가설인 문장은 무엇이고, 어떻게 검증할 건가요?"
  ];
}

function latestHistory(input: WhiteboardAssistantRequest) {
  return (input.history ?? []).slice(-8);
}

function buildMessages(
  input: WhiteboardAssistantRequest,
  response: Pick<WhiteboardAssistantResponse, "reply" | "targetNodeKey" | "suggestion" | "followUps">,
  createdAt: string
): WhiteboardAssistantMessage[] {
  return [
    {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.message,
      targetNodeKey: input.targetNodeKey,
      createdAt
    },
    {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: response.reply,
      targetNodeKey: response.targetNodeKey,
      suggestion: response.suggestion,
      followUps: response.followUps,
      createdAt
    }
  ];
}

function buildFounderPrompt(idea: IdeaDetail, board: Whiteboard, input: WhiteboardAssistantRequest, fallbackTarget: WhiteboardNodeKey) {
  return [
    "You are IdeaFlow's AI founder coach for a software startup whiteboard.",
    "Do not impersonate, quote, or claim to be any real founder. Use the shared mental models of successful software founders.",
    "Respond in Korean. Be candid, specific, and constructive. Avoid generic encouragement.",
    "",
    "Founder mental models:",
    founderPrinciples,
    "",
    "Your job:",
    "1. Read the whole whiteboard and recent conversation.",
    "2. Identify the weakest or most important node unless the user requested a target node.",
    "3. Give founder-style feedback: painful problem, narrow ICP, existing alternative, 10x value, MVP experiment, distribution, payment, risk.",
    "4. Produce one concrete node suggestion that the user can apply to the board.",
    "5. Ask high-leverage follow-up questions that force evidence and next action.",
    "",
    "Output only JSON. Shape: { reply, targetNodeKey, suggestion, followUps }.",
    "reply: 3-5 concise Korean sentences. Include one uncomfortable but useful critique.",
    "targetNodeKey: one allowed key.",
    "suggestion: concrete Korean text for the target node. No markdown table.",
    "followUps: 3 short Korean questions.",
    "",
    `Allowed targetNodeKey values: ${WHITEBOARD_NODE_DEFINITIONS.map((node) => node.key).join(", ")}`,
    `Default targetNodeKey if uncertain: ${fallbackTarget}`,
    `Focus guide for target node: ${nodeFocus[fallbackTarget]}`,
    `Idea: ${JSON.stringify(idea)}`,
    `Whiteboard snapshot:\n${boardSnapshot(board)}`,
    `Recent conversation: ${JSON.stringify(latestHistory(input))}`,
    `User message: ${input.message}`,
    `Requested targetNodeKey: ${input.targetNodeKey ?? "auto"}`
  ].join("\n");
}

export function mockWhiteboardAssistant(
  idea: IdeaDetail,
  board: Whiteboard,
  input: WhiteboardAssistantRequest
): WhiteboardAssistantResponse {
  const targetNodeKey = pickTargetNode(board, input.targetNodeKey);
  const targetLabel = nodeLabels[targetNodeKey] ?? targetNodeKey;
  const filledCount = board.nodes.filter((node) => node.content.trim().length > 15).length;
  const historyCount = latestHistory(input).length;
  const suggestion = suggestionFor(targetNodeKey, idea, input.message);
  const followUps = founderFollowUps(targetNodeKey);
  const createdAt = new Date().toISOString();
  const reply = [
    `창업가 관점으로 보면 지금은 ${targetLabel}을 먼저 날카롭게 만들어야 합니다.`,
    `좋은 아이디어처럼 보이는지보다, 특정 고객이 지금 이 문제 때문에 실제로 시간이나 돈을 잃고 있는지가 더 중요합니다.`,
    `현재 보드는 ${filledCount}/7개 노드가 어느 정도 채워졌지만, 아직 사실과 가설이 섞여 있습니다.`,
    historyCount > 0
      ? `앞선 대화 ${historyCount}개를 보면 다음 단계는 더 많은 기능이 아니라 더 좁은 고객과 더 작은 검증 실험입니다.`
      : `다음 단계는 기능을 늘리는 것이 아니라 가장 위험한 가설 하나를 이번 주 안에 검증하는 것입니다.`
  ].join("\n");

  const response = {
    reply,
    targetNodeKey,
    suggestion,
    followUps,
    createdAt
  };

  return {
    ...response,
    messages: buildMessages(input, response, createdAt)
  };
}

function parseAssistantJson(text: string | undefined): Partial<WhiteboardAssistantResponse> {
  if (!text) return {};
  try {
    return JSON.parse(text) as Partial<WhiteboardAssistantResponse>;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]) as Partial<WhiteboardAssistantResponse>;
    } catch {
      return {};
    }
  }
}

function isWhiteboardNodeKey(value: unknown): value is WhiteboardNodeKey {
  return typeof value === "string" && WHITEBOARD_NODE_DEFINITIONS.some((node) => node.key === value);
}

export async function generateWhiteboardAssistant(
  idea: IdeaDetail,
  board: Whiteboard,
  input: WhiteboardAssistantRequest
): Promise<WhiteboardAssistantResponse> {
  const fallback = mockWhiteboardAssistant(idea, board, input);

  if (env.aiMode !== "gemini") {
    return fallback;
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
              text: buildFounderPrompt(idea, board, input, fallback.targetNodeKey)
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = parseAssistantJson(response.text);
    const parsedTarget = isWhiteboardNodeKey(parsed.targetNodeKey) ? parsed.targetNodeKey : fallback.targetNodeKey;
    const createdAt = new Date().toISOString();
    const aiResponse = {
      reply: parsed.reply || fallback.reply,
      targetNodeKey: parsedTarget,
      suggestion: parsed.suggestion || fallback.suggestion,
      followUps: Array.isArray(parsed.followUps) && parsed.followUps.length ? parsed.followUps.slice(0, 4) : fallback.followUps,
      createdAt
    };

    return {
      ...aiResponse,
      messages: buildMessages(input, aiResponse, createdAt)
    };
  } catch (error) {
    console.error(error);
    throw new AppError(503, "AI_UNAVAILABLE", "AI 어시스턴트 응답을 생성하지 못했습니다.");
  }
}
