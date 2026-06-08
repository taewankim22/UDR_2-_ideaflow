import type { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import type {
  ApiResponse,
  IdeaCard,
  IdeaDetail,
  Whiteboard,
  WhiteboardAssistantMessage,
  WhiteboardAssistantRequest,
  WhiteboardAssistantResponse,
  WhiteboardNode,
  WhiteboardNodeKey
} from "@ideaflow/shared/types";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Maximize2,
  MessageSquare,
  Move,
  PanelTop,
  Save,
  Send,
  Sparkles,
  Wand2,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { EmptyState } from "../../components/common/EmptyState";
import { boardOrder, nodeTheme } from "../../lib/uiConfig";
import {
  defaultViewport,
  getBoardNode,
  makeEmptyBoard,
  updateBoardNode,
  updateBoardNodeContent,
  updateBoardNodePosition,
  updateBoardViewport
} from "../../lib/whiteboard";

interface WhiteboardViewProps {
  ideas: IdeaCard[];
  selectedIdea: IdeaDetail | null;
  whiteboard: Whiteboard | null;
  assistantMessages: WhiteboardAssistantMessage[];
  isSaving: boolean;
  onPickIdea: (id: string) => void;
  onChange: Dispatch<SetStateAction<Whiteboard | null>>;
  onSave: () => Promise<void>;
  onAskAssistant: (input: WhiteboardAssistantRequest) => Promise<ApiResponse<WhiteboardAssistantResponse>>;
  onNext: () => void;
}

type DragState = {
  nodeId: string;
  startX: number;
  startY: number;
  nodeX: number;
  nodeY: number;
};

type AssistantSuggestion = {
  key: WhiteboardNodeKey;
  text: string;
};

const quickPrompts: Array<{ label: string; key: WhiteboardNodeKey; text: string }> = [
  {
    label: "타깃 구체화",
    key: "targetUser",
    text: "가장 먼저 돈을 내고라도 해결하고 싶은 1차 사용자를 한 문장으로 좁혀보세요."
  },
  {
    label: "MVP 줄이기",
    key: "validationPlan",
    text: "첫 버전은 핵심 문제 하나를 검증하는 기능 1~2개만 남기고 나머지는 뒤로 미루세요."
  },
  {
    label: "리스크 찾기",
    key: "currentAlternatives",
    text: "사용자가 지금 쓰는 대안과 그 대안을 버리지 않을 이유를 함께 적어보세요."
  }
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function nodeSize(node: WhiteboardNode) {
  return {
    width: node.size?.width ?? 240,
    height: node.size?.height ?? 150
  };
}

function nodeCenter(node: WhiteboardNode) {
  const size = nodeSize(node);
  return {
    x: node.position.x + size.width / 2,
    y: node.position.y + size.height / 2
  };
}

export function WhiteboardView(props: WhiteboardViewProps) {
  const selectedOwnIdea = props.ideas.find((idea) => idea.id === props.selectedIdea?.id) ?? props.ideas[0];
  const [isDirty, setIsDirty] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessage, setAssistantMessage] = useState(
    "성공한 소프트웨어 창업가들의 사고방식으로 문제, 타깃, MVP를 더 날카롭게 다듬어볼게요. 막히는 지점을 물어보면 바로 다음 검증 질문을 제안합니다."
  );
  const [assistantSuggestion, setAssistantSuggestion] = useState<AssistantSuggestion | null>(null);
  const [isAskingAssistant, setIsAskingAssistant] = useState(false);
  const { isSaving, onSave } = props;

  useEffect(() => {
    setIsDirty(false);
    setDragState(null);
    setAssistantSuggestion(null);
  }, [selectedOwnIdea?.id]);

  useEffect(() => {
    if (!isDirty || isSaving) return;
    const timer = window.setTimeout(() => {
      void onSave().then(() => setIsDirty(false));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [isDirty, isSaving, onSave]);

   const board =
    props.whiteboard && props.whiteboard.ideaId === selectedOwnIdea?.id
      ? props.whiteboard
      : makeEmptyBoard(selectedOwnIdea?.id ?? "");
  const viewport = board.viewport ?? defaultViewport;
  const filledCount = boardOrder.filter((key) => getBoardNode(board, key).content.trim()).length;
  const nextBlankKey = boardOrder.find((key) => !getBoardNode(board, key).content.trim()) ?? null;
  const completion = Math.round((filledCount / boardOrder.length) * 100);
  const latestFollowUps =
    props.assistantMessages
      .slice()
      .reverse()
      .find((message) => message.role === "assistant" && message.followUps?.length)?.followUps ?? [];

  const canvasSize = useMemo(() => {
    const maxX = Math.max(...board.nodes.map((node) => node.position.x + nodeSize(node).width), 1000);
    const maxY = Math.max(...board.nodes.map((node) => node.position.y + nodeSize(node).height), 650);
    return {
      width: maxX + 160,
      height: maxY + 140
    };
  }, [board.nodes]);

  const edgePaths = useMemo(() => {
    const nodesById = new Map(board.nodes.map((node) => [node.id, node]));
    return (board.edges ?? []).flatMap((edge) => {
      const source = nodesById.get(edge.source);
      const target = nodesById.get(edge.target);
      if (!source || !target) return [];
      const start = nodeCenter(source);
      const end = nodeCenter(target);
      const distance = Math.max(Math.abs(end.x - start.x) * 0.45, 70);
      return [
        {
          id: edge.id,
          label: edge.label,
          d: `M ${start.x} ${start.y} C ${start.x + distance} ${start.y}, ${end.x - distance} ${end.y}, ${end.x} ${end.y}`,
          labelX: (start.x + end.x) / 2,
          labelY: (start.y + end.y) / 2
        }
      ];
    });
  }, [board.edges, board.nodes]);

  useEffect(() => {
    if (!dragState) return;
    const activeDrag = dragState;

    function handleMove(event: PointerEvent) {
      const nextPosition = {
        x: activeDrag.nodeX + (event.clientX - activeDrag.startX) / viewport.zoom,
        y: activeDrag.nodeY + (event.clientY - activeDrag.startY) / viewport.zoom
      };
      props.onChange((current) =>
        updateBoardNodePosition(current?.ideaId === board.ideaId ? current : board, activeDrag.nodeId, {
          x: clamp(nextPosition.x, 24, canvasSize.width - 260),
          y: clamp(nextPosition.y, 24, canvasSize.height - 180)
        })
      );
      setIsDirty(true);
    }

    function handleUp() {
      setDragState(null);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    }, [board, canvasSize.height, canvasSize.width, dragState, props, viewport.zoom]);

  if (!selectedOwnIdea) {
    return <EmptyState icon={<PanelTop className="mx-auto text-brand-600" size={42} />} title="화이트보드를 만들 아이디어가 없습니다." />;
  }

  function updateNode(key: WhiteboardNodeKey, content: string) {
    setIsDirty(true);
    props.onChange(updateBoardNode(board, key, content));
  }

  function updateNodeById(nodeId: string, content: string) {
    setIsDirty(true);
    props.onChange(updateBoardNodeContent(board, nodeId, content));
  }

  function startDrag(event: ReactPointerEvent, node: WhiteboardNode) {
    event.preventDefault();
    setDragState({
      nodeId: node.id,
      startX: event.clientX,
      startY: event.clientY,
      nodeX: node.position.x,
      nodeY: node.position.y
    });
  }

  function changeZoom(delta: number) {
    setIsDirty(true);
    props.onChange(
      updateBoardViewport(board, {
        ...viewport,
        zoom: clamp(Number((viewport.zoom + delta).toFixed(2)), 0.6, 1.6)
      })
    );
  }

  function resetCanvas() {
    setIsDirty(true);
    props.onChange(updateBoardViewport(board, defaultViewport));
  }

  async function saveBoard() {
    await props.onSave();
    setIsDirty(false);
  }

  async function requestAssistant(message: string, targetNodeKey?: WhiteboardNodeKey) {
    const trimmed = message.trim();
    if (!trimmed || isAskingAssistant) return;

    setIsAskingAssistant(true);
    setAssistantMessage("AI Assistant가 현재 보드 흐름을 읽고 있습니다.");
    try {
      const result = await props.onAskAssistant({
        message: trimmed,
        targetNodeKey,
        board,
        history: props.assistantMessages.slice(-12)
      });

      if (!result.success) {
        setAssistantMessage(result.error.message);
        return;
      }

      setAssistantMessage(result.data.reply);
      setAssistantSuggestion({
        key: result.data.targetNodeKey,
        text: result.data.suggestion
      });
    } finally {
      setIsAskingAssistant(false);
    }
  }

  async function sendAssistantMessage() {
    const trimmed = assistantInput.trim();
    if (!trimmed) return;
    const targetKey = nextBlankKey ?? "validationPlan";
    setAssistantInput("");
    await requestAssistant(trimmed, targetKey);
  }

  function applyAssistantSuggestion() {
    if (!assistantSuggestion) return;
    const existing = getBoardNode(board, assistantSuggestion.key).content.trim();
    const nextContent = existing ? `${existing}\n- ${assistantSuggestion.text}` : assistantSuggestion.text;
    updateNode(assistantSuggestion.key, nextContent);
    setAssistantMessage(`${nodeTheme[assistantSuggestion.key].label} 칸에 제안을 넣었습니다. 이제 이어서 더 날카롭게 다듬어볼게요.`);
    setAssistantSuggestion(null);
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl hover:bg-slate-50" title="뒤로">
            <ArrowLeft size={20} />
          </button>
          <select
            className="h-10 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none"
            value={selectedOwnIdea.id}
            onChange={(event) => props.onPickIdea(event.target.value)}
          >
            {props.ideas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                {idea.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden h-10 items-center gap-2 rounded-2xl border border-brand-100 bg-brand-50 px-4 text-sm font-black text-brand-700 sm:flex">
            <Sparkles size={17} />
            {completion}% 작성
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white" onClick={props.onNext}>
            요약 및 평가
            <ChevronRight size={17} />
          </button>
        </div>
      </header>

      <div className="grid min-h-[720px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative min-h-[720px] overflow-auto bg-[radial-gradient(#E7E2FF_1px,transparent_1px)] bg-[length:18px_18px]">
          <div className="sticky left-0 top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-black text-slate-700">
              <Move className="text-brand-600" size={18} />
              노드를 잡고 움직이며 아이디어 흐름을 정리하세요.
            </div>
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1">
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-50" onClick={() => changeZoom(-0.1)} title="축소">
                <ZoomOut size={17} />
              </button>
              <span className="w-14 text-center text-xs font-black text-slate-500">{Math.round(viewport.zoom * 100)}%</span>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-50" onClick={() => changeZoom(0.1)} title="확대">
                <ZoomIn size={17} />
              </button>
              <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-50" onClick={resetCanvas} title="100%">
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          <div
            className="relative"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              transformOrigin: "top left"
            }}
          >
            <svg className="pointer-events-none absolute inset-0 z-0" width={canvasSize.width} height={canvasSize.height}>
              <defs>
                <marker id="whiteboard-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
                  <path d="M 0 0 L 8 4 L 0 8 z" fill="#A899F5" />
                </marker>
              </defs>
              {edgePaths.map((edge) => (
                <g key={edge.id}>
                  <path d={edge.d} fill="none" markerEnd="url(#whiteboard-arrow)" stroke="#A899F5" strokeLinecap="round" strokeWidth="2.5" />
                  {edge.label ? (
                    <text fill="#6C4CF1" fontSize="12" fontWeight="700" x={edge.labelX} y={edge.labelY - 8}>
                      {edge.label}
                    </text>
                  ) : null}
                </g>
              ))}
            </svg>

            {board.nodes.map((node) => {
              const size = nodeSize(node);
              const theme = node.key ? nodeTheme[node.key] : null;
              const title = node.key ? theme?.label ?? node.label : node.title || node.label;
              const helper = node.key ? theme?.helper : "메모를 입력하세요.";
              const active = dragState?.nodeId === node.id;

              return (
                <article
                  key={node.id}
                  className={`absolute z-10 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow ${
                    theme?.shell ?? "border-slate-200 bg-white"
                  } ${active ? "shadow-xl ring-4 ring-brand-100" : ""}`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    width: size.width,
                    height: size.height
                  }}
                >
                  <button
                    className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-black/5 bg-white/60 px-3 text-left"
                    onPointerDown={(event) => startDrag(event, node)}
                    title="드래그"
                  >
                    <span className={`truncate text-sm font-black ${theme?.accent ?? "text-slate-700"}`}>{title}</span>
                    <Move className="shrink-0 text-slate-400" size={15} />
                  </button>
                  <textarea
                    className="min-h-0 flex-1 bg-white/70 px-3 py-3 text-sm font-semibold leading-5 text-slate-700 outline-none placeholder:text-slate-400 focus:bg-white"
                    value={node.content}
                    placeholder={helper}
                    onChange={(event) => updateNodeById(node.id, event.target.value)}
                  />
                </article>
              );
            })}
          </div>
        </div>

                        <aside className="flex h-[720px] flex-col border-l border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-lg font-black">
            <Bot className="text-brand-600" size={24} />
            AI Assistant
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            현재 보드 상태를 API로 보내고, 돌아온 제안을 원하는 노드에 바로 적용할 수 있습니다.
                    </p>

          <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            {props.assistantMessages.length === 0 ? (
              <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm font-semibold leading-6 text-brand-800">
                {assistantMessage}
              </div>
            ) : (
              <div className="grid gap-3">
                {props.assistantMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${
                      message.role === "user" ? "ml-8 bg-brand-600 text-white" : "mr-8 border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <p>{message.content}</p>
                    {message.role === "assistant" && message.targetNodeKey ? (
                      <div className="mt-2 text-xs font-black text-brand-600">{nodeTheme[message.targetNodeKey].label} 제안</div>
                    ) : null}
                  </div>
                ))}
                {isAskingAssistant ? (
                  <div className="mr-8 inline-flex items-center gap-2 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-black text-brand-700">
                    <Loader2 className="spin" size={16} />
                    답변 생성 중
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {nextBlankKey ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
              다음으로 채울 칸: {nodeTheme[nextBlankKey].label}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800">
              핵심 7노드가 모두 채워졌습니다. 이제 AI 평가로 넘어가도 좋습니다.
            </div>
          )}

          {latestFollowUps.length ? (
            <div className="mt-4 grid gap-2">
              {latestFollowUps.map((followUp) => (
                <button
                  key={followUp}
                  className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-left text-sm font-bold leading-5 text-brand-800 hover:border-brand-200 disabled:opacity-60"
                  disabled={isAskingAssistant}
                  onClick={() => void requestAssistant(followUp, nextBlankKey ?? undefined)}
                >
                  {followUp}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-5 grid gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt.label}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm font-black text-slate-700 hover:border-brand-200 hover:bg-brand-50 disabled:opacity-60"
                disabled={isAskingAssistant}
                onClick={() => void requestAssistant(prompt.text, prompt.key)}
              >
                <span>{prompt.label}</span>
                {isAskingAssistant ? <Loader2 className="spin text-brand-600" size={16} /> : <Wand2 className="text-brand-600" size={16} />}
              </button>
            ))}
          </div>

          {assistantSuggestion ? (
            <div className="mt-5 rounded-2xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-800">
                <MessageSquare className="text-brand-600" size={17} />
                {nodeTheme[assistantSuggestion.key].label} 제안
              </div>
              <p className="text-sm font-semibold leading-6 text-slate-600">{assistantSuggestion.text}</p>
              <button className="mt-4 h-10 w-full rounded-2xl bg-brand-600 text-sm font-black text-white" onClick={applyAssistantSuggestion}>
                보드에 넣기
              </button>
            </div>
          ) : null}

                    </div>

          <div className="mt-3 flex shrink-0 items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <textarea
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm font-semibold leading-5 text-slate-700 outline-none placeholder:text-slate-400"
              value={assistantInput}
              onChange={(event) => setAssistantInput(event.target.value)}
              placeholder="막히는 칸이나 궁금한 점을 입력하세요."
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendAssistantMessage();
                }
              }}
            />
            <button
              className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white disabled:bg-slate-300"
              disabled={!assistantInput.trim() || isAskingAssistant}
              onClick={() => void sendAssistantMessage()}
              title="전송"
            >
              {isAskingAssistant ? <Loader2 className="spin" size={17} /> : <Send size={17} />}
            </button>
          </div>
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
        <div
          className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-5 text-sm font-black ${
            isDirty ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-700"
          }`}
        >
          <CheckCircle2 className={isDirty ? "text-amber-500" : "text-emerald-500"} size={18} />
          {props.isSaving ? "저장 중" : isDirty ? "저장 대기" : "저장됨"}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700 disabled:opacity-60"
            disabled={props.isSaving}
            onClick={() => void saveBoard()}
          >
            {props.isSaving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
            수동 저장
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-5 text-sm font-black text-white" onClick={props.onNext}>
            다음: AI 요약 및 평가
            <ChevronRight size={17} />
          </button>
        </div>
      </footer>
    </section>
  );
}
