import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Category, CreateIdeaRequest } from "@ideaflow/shared/types";
import { CATEGORIES } from "@ideaflow/shared/types";
import { Loader2, PenLine } from "lucide-react";
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
    <form
      className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-card"
      onSubmit={props.onSubmit}
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-brand-700">+10P</p>
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
          <FormField label="제목">
            <input
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              value={props.form.title}
              onChange={(event) => props.setForm((previous) => ({ ...previous, title: event.target.value }))}
              maxLength={80}
              required
            />
          </FormField>
          <FormField label="카테고리">
            <select
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              value={props.form.category}
              onChange={(event) =>
                props.setForm((previous) => ({ ...previous, category: event.target.value as Category }))
              }
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="한 줄 소개">
          <input
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            value={props.form.oneLine}
            onChange={(event) => props.setForm((previous) => ({ ...previous, oneLine: event.target.value }))}
            maxLength={140}
            required
          />
        </FormField>

        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label="문제">
            <textarea
              className="min-h-60 rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-7 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              value={props.form.problem}
              onChange={(event) => props.setForm((previous) => ({ ...previous, problem: event.target.value }))}
              required
            />
          </FormField>
          <FormField label="해결 방법">
            <textarea
              className="min-h-60 rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-7 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              value={props.form.solution}
              onChange={(event) => props.setForm((previous) => ({ ...previous, solution: event.target.value }))}
              required
            />
          </FormField>
        </div>
      </div>
    </form>
  );
}
