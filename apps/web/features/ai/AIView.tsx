import type { AIEvaluation, IdeaCard, IdeaDetail, Whiteboard } from "@ideaflow/shared/types";
import { ArrowLeft, BrainCircuit, CircleGauge, Loader2, MoreHorizontal, Share2 } from "lucide-react";
import { EmptyState } from "../../components/common/EmptyState";
import { categoryTags } from "../../lib/uiConfig";
import { getBoardNode, makeEmptyBoard } from "../../lib/whiteboard";

interface AIViewProps {
  ideas: IdeaCard[];
  selectedIdea: IdeaDetail | null;
  whiteboard: Whiteboard | null;
  evaluation: AIEvaluation | null;
  isRunning: boolean;
  points: number;
  onPickIdea: (id: string) => void;
  onRun: () => Promise<void>;
  onBack: () => void;
}

export function AIView(props: AIViewProps) {
  const selectedOwnIdea = props.ideas.find((idea) => idea.id === props.selectedIdea?.id) ?? props.ideas[0];

  if (!selectedOwnIdea) {
    return (
      <EmptyState
        icon={<BrainCircuit className="mx-auto text-brand-600" size={42} />}
        title="평가할 아이디어가 없습니다."
      />
    );
  }

  const score = props.evaluation?.overallScore ?? 0;
  const board = props.whiteboard ?? makeEmptyBoard(selectedOwnIdea.id);
  const mvp = getBoardNode(board, "validationPlan").content || "화이트보드 MVP 노드에 최소 기능을 정리하세요.";
  const target = getBoardNode(board, "targetUser").content || "타겟 사용자를 화이트보드에서 구체화하세요.";

  return (
    <section className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <button className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-slate-50" onClick={props.onBack}>
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
          <button className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black">
            <Share2 size={17} />
            공유
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-2xl hover:bg-slate-50">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 border-b border-slate-200 text-center text-sm font-black text-slate-500">
        <span className="py-4">요약</span>
        <span className="border-b-4 border-brand-600 py-4 text-brand-700">AI 평가</span>
        <span className="py-4">개선 제안</span>
      </div>

      <div className="p-5">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="rounded-2xl border border-slate-200 p-5 text-center">
            <h2 className="text-left text-lg font-black">종합 점수</h2>
            <div
              className="mx-auto mt-5 grid h-36 w-36 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#6C4CF1 ${score * 3.6}deg, #EEEAFD 0deg)`
              }}
            >
              <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
                <strong className="text-4xl font-black text-brand-600">
                  {score || "--"}
                  <span className="text-base">/100</span>
                </strong>
              </div>
            </div>
            <p className="mt-5 text-sm font-bold leading-6 text-slate-600">
              {props.evaluation
                ? "좋은 아이디어예요. 핵심 가설을 빠르게 검증해보세요."
                : "평가를 실행하면 점수가 표시됩니다."}
            </p>
            <button
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 text-sm font-black text-white disabled:opacity-60"
              disabled={props.isRunning || props.points < 5}
              onClick={() => void props.onRun()}
            >
              {props.isRunning ? <Loader2 className="spin" size={17} /> : <CircleGauge size={17} />}
              평가 실행 -5P
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="mb-4 text-lg font-black">평가 항목</h2>
            <div className="grid gap-4">
              <ScoreBar label="시장성" value={props.evaluation?.scores.market ?? 0} />
              <ScoreBar label="실현 가능성" value={props.evaluation?.scores.feasibility ?? 0} />
              <ScoreBar label="수익성" value={props.evaluation?.scores.profitability ?? 0} />
              <ScoreBar label="차별성" value={props.evaluation?.scores.differentiation ?? 0} />
              <ScoreBar label="성장 가능성" value={props.evaluation?.scores.growth ?? 0} />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <ReportRow label="아이디어 요약" value={props.evaluation?.summary ?? selectedOwnIdea.oneLine} />
          <ReportRow label="문제점" value={props.selectedIdea?.problem || "잠금 해제 후 문제 설명이 표시됩니다."} />
          <ReportRow label="해결 방법" value={props.selectedIdea?.solution || "잠금 해제 후 해결 설명이 표시됩니다."} />
          <ReportRow label="MVP" value={mvp} />
          <ReportRow
            label="코딩 설계 순서"
            value="1. 사용자 및 인증  2. 아이디어 CRUD  3. 7노드 화이트보드 저장  4. AI 평가 API  5. 포인트 트랜잭션"
          />
          <ReportRow
            label="시장 분석"
            value={
              props.evaluation
                ? "초기 시장은 작게 잡고, 반복 사용 빈도와 지불 의사를 먼저 검증하는 방향이 적합합니다."
                : "AI 평가 실행 후 시장성 근거가 표시됩니다."
            }
          />
          <ReportRow label="타겟층" value={target} />
          <ReportRow label="태그" value={categoryTags[selectedOwnIdea.category].join("  ")} highlight />
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
        <button
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black"
          onClick={props.onBack}
        >
          <ArrowLeft size={17} />
          화이트보드로 돌아가기
        </button>
        <button className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-5 text-sm font-black text-white">
          아이디어 공개하기 (+10P)
        </button>
      </footer>
    </section>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-black">
        <span>{label}</span>
        <span>
          {value}
          <span className="text-xs text-slate-400">/100</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-brand-100">
        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ReportRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="grid border-b border-slate-100 last:border-b-0 md:grid-cols-[150px_1fr]">
      <div className="bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">{label}</div>
      <div className={`px-4 py-3 text-sm font-semibold leading-6 ${highlight ? "text-brand-700" : "text-slate-600"}`}>
        {value}
      </div>
    </div>
  );
}
