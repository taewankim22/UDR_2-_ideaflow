import { useState } from "react";
import type { AIEvaluation, AIEvaluationReport, IdeaCard, IdeaDetail, Whiteboard } from "@ideaflow/shared/types";
import { AlertCircle, ArrowLeft, BrainCircuit, CircleGauge, Code2, Loader2, Share2 } from "lucide-react";
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

type ReportTab = "report" | "suggestions";

function fallbackReport(idea: IdeaDetail, board: Whiteboard): AIEvaluationReport {
  return {
    ideaSummary: idea.oneLine,
    problem: getBoardNode(board, "problemContext").content || idea.problem || "문제 정의가 아직 비어 있습니다.",
    solution: getBoardNode(board, "solutionConcept").content || idea.solution || "해결 방법이 아직 비어 있습니다.",
    mvp: getBoardNode(board, "validationPlan").content || "화이트보드의 MVP 노드를 채우면 더 정확한 평가를 받을 수 있습니다.",
    developmentPlan: [
      "아이디어 작성과 화이트보드 저장 흐름을 완성합니다.",
      "AI Assistant 제안을 보드에 적용하는 흐름을 검증합니다.",
      "AI 평가 리포트를 실행하고 초기 사용자 피드백과 비교합니다."
    ],
    marketAnalysis: "시장 분석은 타깃 사용자의 반복 문제, 현재 대안, 지불 의사 기준으로 검증해야 합니다.",
    targetAudience: getBoardNode(board, "targetUser").content || "초기 타깃 사용자를 더 좁게 정의해야 합니다.",
    keyRisks: ["타깃이 넓을 수 있습니다.", "MVP 범위가 커질 수 있습니다.", "수익 모델 검증이 늦어질 수 있습니다."]
  };
}

export function AIView(props: AIViewProps) {
  const [tab, setTab] = useState<ReportTab>("report");
  const selectedOwnIdea = props.ideas.find((idea) => idea.id === props.selectedIdea?.id) ?? props.ideas[0];

  if (!selectedOwnIdea) {
    return <EmptyState icon={<BrainCircuit className="mx-auto text-brand-600" size={42} />} title="평가할 아이디어가 없습니다." />;
  }

  const board = props.whiteboard ?? makeEmptyBoard(selectedOwnIdea.id);
  const detail = props.selectedIdea ?? {
    ...selectedOwnIdea,
    problem: "",
    solution: ""
  };
  const score = props.evaluation?.overallScore ?? 0;
  const report = props.evaluation?.report ?? fallbackReport(detail, board);
  const hasEnoughPoints = props.points >= 5;

  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl hover:bg-slate-50" onClick={props.onBack} title="화이트보드로 돌아가기">
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
        <button className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black">
          <Share2 size={17} />
          공유
        </button>
      </header>

      <div className="grid grid-cols-2 border-b border-slate-200 text-center text-sm font-black text-slate-500">
        <button className={`py-4 ${tab === "report" ? "border-b-4 border-brand-600 text-brand-700" : ""}`} onClick={() => setTab("report")}>
          리포트
        </button>
        <button className={`py-4 ${tab === "suggestions" ? "border-b-4 border-brand-600 text-brand-700" : ""}`} onClick={() => setTab("suggestions")}>
          개선 제안
        </button>
      </div>

      <div className="p-5">
        {!hasEnoughPoints ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
            <AlertCircle size={18} />
            AI 평가는 5P가 필요합니다. 현재 잔액은 {props.points.toLocaleString()}P입니다.
          </div>
        ) : null}

        {props.isRunning ? (
          <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 text-sm font-bold text-brand-800">
            <Loader2 className="spin mr-2 inline" size={18} />
            AI가 아이디어와 화이트보드를 읽고 구조화 리포트를 만들고 있습니다.
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-slate-200 p-5 text-center">
            <h2 className="text-left text-lg font-black">종합 점수</h2>
            <div
              className="mx-auto mt-5 grid h-40 w-40 place-items-center rounded-full"
              style={{ background: `conic-gradient(#6C4CF1 ${score * 3.6}deg, #EEEAFD 0deg)` }}
            >
              <div className="grid h-32 w-32 place-items-center rounded-full bg-white">
                <strong className="text-4xl font-black text-brand-600">
                  {score || "--"}
                  <span className="text-base">/100</span>
                </strong>
              </div>
            </div>
            <p className="mt-5 text-sm font-bold leading-6 text-slate-600">
              {props.evaluation ? props.evaluation.summary : "평가를 실행하면 점수와 구조화 리포트가 생성됩니다."}
            </p>
            <button
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 text-sm font-black text-white disabled:opacity-60"
              disabled={props.isRunning || !hasEnoughPoints}
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
              <ScoreBar label="성장성" value={props.evaluation?.scores.growth ?? 0} />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          {tab === "report" ? (
            <>
              <ReportRow label="아이디어 요약" value={report.ideaSummary} />
              <ReportRow label="문제점" value={report.problem} />
              <ReportRow label="해결 방법" value={report.solution} />
              <ReportRow label="MVP" value={report.mvp} />
              <ReportList label="코딩 설계 순서" values={report.developmentPlan} icon />
              <ReportRow label="시장 분석" value={report.marketAnalysis} />
              <ReportRow label="타깃층" value={report.targetAudience} />
              <ReportList label="핵심 리스크" values={report.keyRisks} />
              <ReportRow label="태그" value={categoryTags[selectedOwnIdea.category].join("  ")} highlight />
            </>
          ) : (
            <>
              {(props.evaluation?.suggestions ?? ["AI 평가를 실행하면 개선 제안이 표시됩니다."]).map((suggestion, index) => (
                <ReportRow key={suggestion} label={`개선 ${index + 1}`} value={suggestion} />
              ))}
              <ReportRow label="다음 액션" value="인터뷰 5명, 클릭 가능한 MVP 1개, 가격 가정 1개를 먼저 검증해보세요." highlight />
            </>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
        <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black" onClick={props.onBack}>
          <ArrowLeft size={17} />
          화이트보드로 돌아가기
        </button>
        <span className="text-sm font-black text-slate-500">잔액 {props.points.toLocaleString()}P</span>
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
        <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ReportRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="grid border-b border-slate-100 last:border-b-0 md:grid-cols-[150px_1fr]">
      <div className="bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">{label}</div>
      <div className={`px-4 py-3 text-sm font-semibold leading-6 ${highlight ? "text-brand-700" : "text-slate-600"}`}>{value}</div>
    </div>
  );
}

function ReportList({ label, values, icon }: { label: string; values: string[]; icon?: boolean }) {
  return (
    <div className="grid border-b border-slate-100 last:border-b-0 md:grid-cols-[150px_1fr]">
      <div className="bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">{label}</div>
      <div className="grid gap-2 px-4 py-3">
        {values.map((value, index) => (
          <div key={`${value}-${index}`} className="flex gap-2 text-sm font-semibold leading-6 text-slate-600">
            {icon ? <Code2 className="mt-1 shrink-0 text-brand-600" size={15} /> : <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />}
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
