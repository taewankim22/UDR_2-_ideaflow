import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import type { Category, CreateIdeaRequest } from "@ideaflow/shared/types";
import { CATEGORIES } from "@ideaflow/shared/types";
import { Image, Loader2, PenLine } from "lucide-react";
import { FormField } from "../../components/common/FormField";
import { categoryLabels } from "../../lib/uiConfig";

interface ComposeViewProps {
  form: CreateIdeaRequest;
  setForm: Dispatch<SetStateAction<CreateIdeaRequest>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
}

export function ComposeView(props: ComposeViewProps) {
  return (
    <form className="mx-auto max-w-5xl rounded-[24px] border border-slate-200 bg-white p-6 shadow-card" onSubmit={props.onSubmit}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-brand-700">작성 완료 시 +10P</p>
          <h1 className="text-3xl font-black">새 아이디어 만들기</h1>
        </div>
        <button
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand-600 px-5 font-black text-white disabled:opacity-60"
          disabled={props.isLoading}
        >
          {props.isLoading ? <Loader2 className="spin" size={18} /> : <PenLine size={18} />}
          저장
        </button>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-[1fr_220px]">
          <CountedField label="제목" count={props.form.title.length} max={80}>
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              value={props.form.title}
              onChange={(event) => props.setForm((previous) => ({ ...previous, title: event.target.value }))}
              maxLength={80}
              required
            />
          </CountedField>
          <FormField label="카테고리">
            <select
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              value={props.form.category}
              onChange={(event) => props.setForm((previous) => ({ ...previous, category: event.target.value as Category }))}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <CountedField label="한 줄 소개" count={props.form.oneLine.length} max={140}>
          <input
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            value={props.form.oneLine}
            onChange={(event) => props.setForm((previous) => ({ ...previous, oneLine: event.target.value }))}
            maxLength={140}
            required
          />
        </CountedField>

        <div className="grid gap-5 lg:grid-cols-2">
          <CountedField label="문제" count={props.form.problem.length} max={1000}>
            <textarea
              className="min-h-60 rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-7 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              value={props.form.problem}
              onChange={(event) => props.setForm((previous) => ({ ...previous, problem: event.target.value }))}
              maxLength={1000}
              required
            />
          </CountedField>
          <CountedField label="해결" count={props.form.solution.length} max={1000}>
            <textarea
              className="min-h-60 rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-7 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              value={props.form.solution}
              onChange={(event) => props.setForm((previous) => ({ ...previous, solution: event.target.value }))}
              maxLength={1000}
              required
            />
          </CountedField>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-bold text-slate-500">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600">
            <Image size={20} />
          </div>
          커버 이미지를 업로드하지 않으면 카테고리별 플레이스홀더가 자동으로 표시됩니다.
        </div>
      </div>
    </form>
  );
}

function CountedField(props: { label: string; count: number; max: number; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between text-sm font-bold text-slate-600">
        {props.label}
        <span className="font-mono text-xs text-slate-400">
          {props.count}/{props.max}
        </span>
      </span>
      {props.children}
    </label>
  );
}
