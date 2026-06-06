import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import type { IdeaCard, IdeaDetail, Whiteboard, WhiteboardNodeKey } from "@ideaflow/shared/types";
import { ArrowLeft, Bot, CheckCircle2, ChevronRight, Loader2, PanelTop, Save, Send } from "lucide-react";
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

export function WhiteboardView(props: WhiteboardViewProps) {
  const selectedOwnIdea = props.ideas.find((idea) => idea.id === props.selectedIdea?.id) ?? props.ideas[0];
  const [isDirty, setIsDirty] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("7개 칸을 채우면 AI 평가가 더 구체적으로 나옵니다.");
  const { isSaving, onSave } = props;

  useEffect(() => {
    setIsDirty(false);
  }, [selectedOwnIdea?.id, props.whiteboard?.updatedAt]);

  useEffect(() => {
    if (!isDirty || isSaving) return;
    const timer = window.setTimeout(() => {
      void onSave().then(() => setIsDirty(false));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [isDirty, isSaving, onSave]);

  if (!selectedOwnIdea) {
    return <EmptyState icon={<PanelTop className="mx-auto text-brand-600" size={42} />} title="화이트보드를 만들 아이디어가 없습니다." />;
  }

  const board = props.whiteboard?.ideaId === selectedOwnIdea.id ? props.whiteboard : makeEmptyBoard(selectedOwnIdea.id);
  const selectedTitle = selectedOwnIdea.title;

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
    if (!trimmed) return;
    setAssistantMessage(`프롬프트 팁: "${trimmed}"를 ${selectedTitle}의 타깃, MVP, 수익 모델과 연결해서 더 구체화해 보세요.`);
    setAssistantInput("");
  }

  return (
    <section className="rounded-[24px] border border-slate-200 bg-white shadow-card">
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
        <button className="inline-flex h-10 items-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white" onClick={props.onNext}>
          AI 요약·평가
        </button>
      </header>

      <div className="grid min-h-[680px] lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="bg-[radial-gradient(#E7E2FF_1px,transparent_1px)] bg-[length:18px_18px] p-5 lg:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <span className="font-black text-slate-950">고정 7노드 입력 보드</span>
            <span className="text-sm font-bold text-slate-400">입력 후 자동저장 PUT 호출</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {boardOrder.map((key) => {
              const node = getBoardNode(board, key);
              const theme = nodeTheme[key];
              return (
                <label key={key} className={`${theme.shell} grid min-h-44 gap-2 rounded-2xl border p-4 shadow-sm`}>
                  <span className={`text-base font-black ${theme.accent}`}>{theme.label}</span>
                  <textarea
                    className="min-h-28 rounded-xl bg-white/75 p-3 text-sm font-semibold leading-6 text-slate-700 outline-none focus:ring-4 focus:ring-brand-100"
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
            AI 프롬프트 팁
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            shared/types.ts 타입만 사용한다는 전제로, 입력 칸을 더 명확하게 만드는 질문을 던져 보세요.
          </p>
          <div className="mt-5 rounded-2xl bg-brand-50 p-4 text-sm font-semibold leading-6 text-brand-800">{assistantMessage}</div>
          <div className="mt-auto flex shrink-0 items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <textarea
              className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm font-semibold leading-5 text-slate-700 outline-none placeholder:text-slate-400"
              value={assistantInput}
              onChange={(event) => setAssistantInput(event.target.value)}
              placeholder="예: 타깃 사용자를 더 좁혀줘"
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
            다음: AI 요약·평가
            <ChevronRight size={17} />
          </button>
        </div>
      </footer>
    </section>
  );
}
