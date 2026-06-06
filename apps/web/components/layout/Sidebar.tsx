import type { ReactNode } from "react";
import { useState } from "react";
import type { AuthSession } from "@ideaflow/shared/types";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Home,
  LogOut,
  PanelTop,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  User
} from "lucide-react";
import type { AppView } from "../../types/app";

interface SidebarProps {
  active: AppView;
  balance: number;
  session: AuthSession;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

export function Sidebar(props: SidebarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <aside className="sticky top-0 hidden h-screen flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
      <div className="mb-10 flex items-center gap-2">
        <Sparkles className="text-brand-600" size={28} />
        <span className="text-2xl font-black">IdeaFlow</span>
      </div>

      <button
        className="mb-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 text-sm font-black text-white shadow-lg shadow-brand-200 transition hover:bg-brand-700"
        onClick={() => props.onNavigate("compose")}
      >
        <Plus size={18} />
        아이디어 만들기
      </button>

      <nav className="grid gap-2 text-sm font-extrabold text-slate-700">
        <NavButton icon={<Home size={21} />} label="홈" view="feed" active={props.active} onClick={props.onNavigate} />
        <NavButton icon={<Search size={21} />} label="탐색" view="explore" active={props.active} onClick={props.onNavigate} />
        <NavButton
          icon={<PanelTop size={21} />}
          label="아이디어 보드"
          view="whiteboard"
          active={props.active}
          onClick={props.onNavigate}
        />
        <NavButton
          icon={<FileText size={21} />}
          label="새 아이디어"
          view="compose"
          active={props.active}
          onClick={props.onNavigate}
        />
        <NavButton
          icon={<User size={21} />}
          label="마이페이지"
          view="profile"
          active={props.active}
          onClick={props.onNavigate}
        />
      </nav>

      <div className="mt-auto grid gap-5">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-700">내 포인트</p>
          <div className="mt-2 flex items-center gap-2">
            <Star className="fill-amber-400 text-amber-400" size={24} />
            <strong className="text-3xl font-black text-slate-950">{props.balance.toLocaleString()}P</strong>
          </div>
          <button
            className="mt-4 h-10 w-full rounded-xl bg-brand-100 text-sm font-black text-brand-700"
            onClick={() => props.onNavigate("profile")}
          >
            포인트 현황
          </button>
        </div>

        <div className="relative">
          {profileOpen ? (
            <div className="absolute bottom-[58px] left-0 right-0 rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-950 ring-1 ring-slate-200">
                  <User size={30} />
                </div>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black">{props.session.user.username}</strong>
                  <span className="block truncate text-xs font-semibold text-slate-500">
                    @{props.session.user.email.split("@")[0]}
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <button
                  className="h-10 rounded-xl bg-brand-700 text-sm font-black text-white"
                  onClick={() => props.onNavigate("profile")}
                >
                  내 정보
                </button>
                <button
                  className="h-10 rounded-xl bg-slate-100 text-sm font-black text-slate-700"
                  onClick={props.onLogout}
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : null}

          <button
            className="flex w-full items-center gap-3 rounded-2xl bg-white text-left"
            onClick={() => setProfileOpen((open) => !open)}
          >
            <img
              className="h-11 w-11 rounded-full border border-brand-100 object-cover"
              src="/profile-avatar.png"
              alt=""
            />
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-black text-slate-950">
                {props.session.user.username}
              </strong>
              <span className="block truncate text-xs font-semibold text-slate-500">
                @{props.session.user.email.split("@")[0]}
              </span>
            </div>
            {profileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <button className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100" title="설정">
            <Settings size={18} />
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100"
            title="로그아웃"
            onClick={props.onLogout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavButton(props: {
  icon: ReactNode;
  label: string;
  view: AppView;
  active: AppView;
  onClick: (view: AppView) => void;
}) {
  return (
    <button
      className={`flex h-11 items-center gap-3 rounded-2xl px-3 text-left transition ${
        props.active === props.view
          ? "bg-brand-50 text-brand-700"
          : "text-slate-700 hover:bg-slate-50 hover:text-brand-700"
      }`}
      onClick={() => props.onClick(props.view)}
    >
      {props.icon}
      <span>{props.label}</span>
    </button>
  );
}
