import type { Dispatch, SetStateAction } from "react";
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

export function WhiteboardView(props: WhiteboardViewProps) {
  const selectedOwnIdea = props.ideas.find((idea) => idea.id === props.selectedIdea?.id) ?? props.ideas[0];

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
    props.onChange(updateBoardNode(board, key, content));
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

      <div className="grid min-h-[680px] lg:grid-cols-[minmax(0,1fr)_260px]">
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

        <aside className="border-l border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-lg font-black">
            <Bot className="text-brand-600" size={24} />
            AI Assistant
          </div>
          <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-600">
            <p className="rounded-2xl bg-brand-50 p-4 font-bold text-brand-800">
              7개 노드를 채운 뒤 요약 및 평가를 실행하면 점수와 개선 제안을 받을 수 있습니다.
            </p>
            <p className="rounded-2xl bg-slate-50 p-4">
              문제와 타겟 사용자가 구체적일수록 시장성, 수익성, 차별성 점수가 안정적으로 계산됩니다.
            </p>
          </div>
        </aside>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
        <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700">
          <CheckCircle2 className="text-emerald-500" size={18} />
          저장됨
        </button>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-700 disabled:opacity-60"
            disabled={props.isSaving}
            onClick={() => void props.onSave()}
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
