import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import type { IdeaCard, IdeaDetail, Whiteboard, WhiteboardNodeKey } from "@ideaflow/shared/types";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  PanelTop,
  Save,
  Send,
  Wand2
} from "lucide-react";
import { EmptyState } from "../../components/common/EmptyState";
import { boardOrder, nodeTheme } from "../../lib/uiConfig";
import { getBoardNode, makeEmptyBoard, updateBoardNode } from "../../lib/whiteboard";

interface WhiteboardViewProps {
  ideas: IdeaCard[];
  selectedIdea: IdeaDetail | null;
  whiteboard: Whiteboard | null;
  isSaving: boolean;
  onPickIdea: (id: string) => void;
  onChange: Dispatch<SetStateAction<Whiteboard | null>>;
  onSave: () => Promise<void>;
  onNext: () => void;
}

interface AssistantMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

const initialAssistantMessages: AssistantMessage[] = [
  {
    id: "assistant-intro",
    role: "assistant",
    content: "노드 내용을 보면서 문제 정의, 타깃 사용자, MVP 검증 방법을 함께 다듬을 수 있어요."
  }
];

export function WhiteboardView(props: WhiteboardViewProps) {
  const selectedOwnIdea = props.ideas.find((idea) => idea.id === props.selectedIdea?.id) ?? props.ideas[0];
  const [isDirty, setIsDirty] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>(initialAssistantMessages);

  useEffect(() => {
    setIsDirty(false);
    setAssistantMessages(initialAssistantMessages);
    setAssistantInput("");
  }, [selectedOwnIdea?.id, props.whiteboard?.updatedAt]);

  if (!selectedOwnIdea) {
    return (
      <EmptyState
        icon={<PanelTop className="mx-auto text-brand-600" size={42} />}
        title="화이트보드를 만들 아이디어가 없습니다."
      />
    );
  }

  const board =
    props.whiteboard?.ideaId === selectedOwnIdea.id ? props.whiteboard : makeEmptyBoard(selectedOwnIdea.id);

  function updateNode(key: WhiteboardNodeKey, content: string) {
    setIsDirty(true);
    props.onChange(updateBoardNode(board, key, content));
  }

  async function saveBoard() {
    await props.onSave();
    setIsDirty(false);
  }

  function sendAssistantMessage() {
    const trimmed = assistantInput.trim();
    if (!trimmed) {
      return;
    }

    setAssistantInput("");
    setAssistantMessages((messages) => [
      ...messages,
      { id: `user-${Date.now()}`, role: "user", content: trimmed },
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          "AI 백엔드가 연결되면 이 질문과 현재 보드 노드를 함께 보내 답변을 받아오면 됩니다. 지금은 프론트 대화 흐름만 확인할 수 있어요."
      }
    ]);
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <button className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-slate-50">
            <ArrowLeft size={20} />
          </button>
          <select
            className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none"
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
          <button
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white"
            onClick={props.onNext}
          >
            요약 및 평가
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-slate-50">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      <div className="grid min-h-[680px] lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative overflow-hidden bg-[radial-gradient(#E7E2FF_1px,transparent_1px)] bg-[length:18px_18px] p-5 lg:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-4 text-slate-600">
              <Wand2 size={19} />
              <span className="font-black text-slate-950">W</span>
              <span className="font-black text-brand-600">T</span>
              <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm font-black">100%</span>
            </div>
            <span className="text-sm font-bold text-slate-400">고정 7노드 편집 방식</span>
          </div>

          <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-3 lg:grid-rows-[auto_auto_auto_auto]">
            {boardOrder.map((key) => {
              const node = getBoardNode(board, key);
              const theme = nodeTheme[key];
              return (
                <label
                  key={key}
                  className={`${theme.grid} ${theme.shell} grid min-h-40 gap-2 rounded-2xl border p-4 shadow-sm`}
                >
                  <span className={`text-center text-base font-black ${theme.accent}`}>{theme.label}</span>
                  <textarea
                    className="min-h-24 rounded-xl bg-white/70 p-3 text-center text-sm font-semibold leading-6 text-slate-700 outline-none focus:ring-4 focus:ring-brand-100"
                    value={node.content}
                    placeholder={theme.helper}
                    onChange={(event) => updateNode(key, event.target.value)}
                  />
                </label>
              );
            })}
          </div>
        </div>

        <aside className="flex h-[680px] min-h-0 flex-col border-l border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-lg font-black">
            <Bot className="text-brand-600" size={24} />
            AI Assistant
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            백엔드 AI 연결 전까지는 대화 UI와 전송 흐름을 확인하는 영역입니다.
          </p>

          <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {assistantMessages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl p-3 text-sm font-semibold leading-6 ${
                  message.role === "assistant"
                    ? "bg-brand-50 text-brand-800"
                    : "ml-6 border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="mt-auto grid shrink-0 gap-2 pt-4">
            <button
              className="rounded-xl bg-slate-50 px-3 py-2 text-left text-xs font-bold text-slate-500 hover:bg-brand-50 hover:text-brand-700"
              onClick={() => setAssistantInput("이 아이디어의 MVP 검증 방법을 추천해줘")}
            >
              MVP 검증 방법 추천받기
            </button>
            <button
              className="rounded-xl bg-slate-50 px-3 py-2 text-left text-xs font-bold text-slate-500 hover:bg-brand-50 hover:text-brand-700"
              onClick={() => setAssistantInput("타깃 사용자를 더 구체화해줘")}
            >
              타깃 사용자 구체화하기
            </button>
          </div>

          <div className="mt-3 flex shrink-0 items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <textarea
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm font-semibold leading-5 text-slate-700 outline-none placeholder:text-slate-400"
              value={assistantInput}
              onChange={(event) => setAssistantInput(event.target.value)}
              placeholder="AI에게 물어보기"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendAssistantMessage();
                }
              }}
            />
            <button
              className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white disabled:bg-slate-300"
              disabled={!assistantInput.trim()}
              onClick={sendAssistantMessage}
              title="전송"
            >
              <Send size={17} />
            </button>
          </div>
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
        <div
          className={`inline-flex h-11 items-center gap-2 rounded-2xl border px-5 text-sm font-black ${
            isDirty
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-slate-200 text-slate-700"
          }`}
        >
          <CheckCircle2 className={isDirty ? "text-amber-500" : "text-emerald-500"} size={18} />
          {isDirty ? "수정됨" : "저장됨"}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700 disabled:opacity-60"
            disabled={props.isSaving}
            onClick={() => void saveBoard()}
          >
            {props.isSaving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
            저장
          </button>
          <button
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-5 text-sm font-black text-white"
            onClick={props.onNext}
          >
            다음: 요약 및 평가
            <ChevronRight size={17} />
          </button>
        </div>
      </footer>
    </section>
  );
}
