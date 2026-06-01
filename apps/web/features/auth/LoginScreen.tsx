import type { Dispatch, FormEvent, SetStateAction } from "react";
import { KeyRound, Loader2, Sparkles } from "lucide-react";
import type { LoginFormState } from "../../types/app";

interface LoginScreenProps {
  form: LoginFormState;
  setForm: Dispatch<SetStateAction<LoginFormState>>;
  isLoading: boolean;
  message: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export function LoginScreen(props: LoginScreenProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_20%_10%,#E9E2FF,transparent_35%),#FAF9FF] px-6 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-brand-100 bg-white shadow-soft lg:grid-cols-[1.05fr_.95fr]">
        <div className="p-8 sm:p-12">
          <div className="mb-10 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-sm font-black text-brand-700">IdeaFlow</p>
              <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                아이디어를 만들고 평가하는 MVP
              </h1>
            </div>
          </div>

          <form className="grid gap-4" onSubmit={props.onSubmit}>
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              이메일
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                type="email"
                value={props.form.email}
                onChange={(event) =>
                  props.setForm((previous) => ({ ...previous, email: event.target.value }))
                }
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              이름
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                value={props.form.username}
                onChange={(event) =>
                  props.setForm((previous) => ({ ...previous, username: event.target.value }))
                }
                minLength={2}
                required
              />
            </label>
            <button
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 font-black text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 disabled:opacity-60"
              disabled={props.isLoading}
            >
              {props.isLoading ? <Loader2 className="spin" size={18} /> : <KeyRound size={18} />}
              로그인
            </button>
          </form>
          {props.message ? (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {props.message}
            </p>
          ) : null}
        </div>

        <aside className="hidden bg-brand-600 p-10 text-white lg:grid">
          <div className="self-center rounded-[28px] bg-white/12 p-7 backdrop-blur">
            <p className="text-sm font-bold text-brand-100">MVP Point Rules</p>
            <div className="mt-6 grid gap-4">
              <PreviewPoint label="가입 보너스" value="+30P" />
              <PreviewPoint label="아이디어 작성" value="+10P" />
              <PreviewPoint label="AI 평가" value="-5P" />
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function PreviewPoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-slate-950">
      <span className="font-bold text-slate-500">{label}</span>
      <strong className="text-2xl font-black text-brand-700">{value}</strong>
    </div>
  );
}
