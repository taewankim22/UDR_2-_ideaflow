import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Provider } from "@ideaflow/shared/types";
import { KeyRound, Loader2, Sparkles } from "lucide-react";
import type { LoginFormState } from "../../types/app";

interface LoginScreenProps {
  form: LoginFormState;
  setForm: Dispatch<SetStateAction<LoginFormState>>;
  isLoading: boolean;
  message: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onSocialLogin: (provider: Provider) => Promise<void>;
}

export function LoginScreen(props: LoginScreenProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8fb] px-6 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft lg:grid-cols-[1.05fr_.95fr]">
        <div className="p-8 sm:p-12">
          <div className="mb-10 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-sm font-black text-brand-700">IdeaFlow</p>
              <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                아이디어를 쓰고, 검증하고, 나누세요
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
                onChange={(event) => props.setForm((previous) => ({ ...previous, email: event.target.value }))}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-600">
              이름
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-950 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                value={props.form.username}
                onChange={(event) => props.setForm((previous) => ({ ...previous, username: event.target.value }))}
                minLength={2}
                required
              />
            </label>
            <button
              className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 font-black text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700 disabled:opacity-60"
              disabled={props.isLoading}
            >
              {props.isLoading ? <Loader2 className="spin" size={18} /> : <KeyRound size={18} />}
              이메일로 시작
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-black text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            OAuth callback mock
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-[#FEE500] px-4 text-[15px] font-bold text-black/85 disabled:opacity-60"
              disabled={props.isLoading}
              onClick={() => void props.onSocialLogin("kakao")}
            >
              <KakaoSymbol />
              카카오 로그인
            </button>
            <button
              className="inline-flex h-12 items-center justify-center gap-[10px] rounded-[20px] border border-[#747775] bg-white px-3 text-sm font-medium leading-5 text-[#1F1F1F] disabled:opacity-60"
              disabled={props.isLoading}
              onClick={() => void props.onSocialLogin("google")}
            >
              <GoogleSymbol />
              Google 계정으로 로그인
            </button>
          </div>

          {props.message ? (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{props.message}</p>
          ) : null}
        </div>

        <aside className="hidden bg-brand-700 p-10 text-white lg:grid">
          <div className="self-center rounded-[28px] bg-white/12 p-7 backdrop-blur">
            <p className="text-sm font-bold text-brand-100">MVP 포인트 규칙</p>
            <div className="mt-6 grid gap-4">
              <PreviewPoint label="가입 보너스" value="+30P" />
              <PreviewPoint label="아이디어 작성" value="+10P" />
              <PreviewPoint label="AI 평가 실행" value="-5P" />
            </div>
            <p className="mt-6 text-sm font-semibold leading-6 text-brand-100">
              mock 데이터로 화면을 먼저 완성하고, API 모드에서는 같은 타입과 클라이언트 계약으로 백엔드에 연결됩니다.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function KakaoSymbol() {
  return (
    <span className="relative inline-block h-[18px] w-[20px] rounded-[50%] bg-black" aria-hidden="true">
      <span className="absolute bottom-[-3px] left-[5px] h-[7px] w-[7px] -rotate-45 bg-black" />
    </span>
  );
}

function GoogleSymbol() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.94H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.06l3-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3 2.34C4.67 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
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
