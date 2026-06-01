import type { ReactNode } from "react";
import type { AuthSession } from "@ideaflow/shared/types";
import type { AppView } from "../../types/app";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppShellProps {
  activeView: AppView;
  balance: number;
  session: AuthSession;
  isLoading: boolean;
  message: string | null;
  children: ReactNode;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  onRefresh: () => void;
}

export function AppShell(props: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#FAF9FF] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar
          active={props.activeView}
          balance={props.balance}
          session={props.session}
          onNavigate={props.onNavigate}
          onLogout={props.onLogout}
        />

        <section className="min-w-0">
          <Topbar isLoading={props.isLoading} onRefresh={props.onRefresh} />

          <div className="mx-auto max-w-[1540px] px-5 py-5 lg:px-8">
            {props.message ? (
              <div className="mb-5 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-800 shadow-sm">
                {props.message}
              </div>
            ) : null}
            {props.children}
          </div>
        </section>
      </div>
    </main>
  );
}
