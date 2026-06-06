import type { AuthSession } from "@ideaflow/shared/types";
import type { ReactNode } from "react";
import { Bell, Heart, Loader2, LogOut, MessageCircle, RefreshCw, Sparkles, User, UserPlus } from "lucide-react";
import { useState } from "react";
import type { AppView } from "../../types/app";

interface TopbarProps {
  balance: number;
  session: AuthSession;
  isLoading: boolean;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  onRefresh: () => void;
}

const notifications = [
  { icon: <MessageCircle size={16} />, title: "새 댓글", detail: "Mina가 아이디어에 댓글을 남겼습니다." },
  { icon: <Heart size={16} />, title: "좋아요", detail: "Joon이 아이디어를 좋아합니다." },
  { icon: <UserPlus size={16} />, title: "새 팔로워", detail: "새 사용자가 팔로우했습니다." }
];

export function Topbar({ balance, session, isLoading, onNavigate, onLogout, onRefresh }: TopbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const userHandle = `@${session.user.email.split("@")[0]}`;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <Sparkles className="text-brand-600" size={24} />
        <span className="text-xl font-black">IdeaFlow</span>
      </div>

      <div className="ml-auto flex items-center gap-3 text-brand-700">
        <div className="hidden rounded-2xl bg-amber-50 px-4 py-2 text-sm font-black text-amber-700 sm:block">
          {balance.toLocaleString()}P
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-brand-50" onClick={onRefresh} title="새로고침">
          {isLoading ? <Loader2 className="spin" size={20} /> : <RefreshCw size={20} />}
        </button>

        <div className="relative">
          <button
            className={`relative grid h-10 w-10 place-items-center rounded-full transition ${notificationOpen ? "bg-brand-600 text-white" : "hover:bg-brand-50"}`}
            onClick={() => {
              setNotificationOpen((open) => !open);
              setProfileOpen(false);
            }}
            title="알림"
          >
            <Bell size={20} />
            <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] font-black text-white ring-2 ring-white">
              3
            </span>
          </button>

          {notificationOpen ? (
            <div className="absolute right-0 mt-3 w-72 rounded-[22px] border border-slate-200 bg-white p-4 text-slate-950 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <strong className="text-base font-black">알림</strong>
                <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-black text-brand-700">3 new</span>
              </div>
              <div className="grid gap-2">
                {notifications.map((item) => (
                  <button key={item.title} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-brand-50">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-brand-700">{item.icon}</span>
                    <span>
                      <span className="block text-sm font-black">{item.title}</span>
                      <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <button
            className={`grid h-10 w-10 place-items-center rounded-full transition ${
              profileOpen ? "bg-brand-600 text-white" : "bg-brand-100 text-brand-700 hover:bg-brand-200"
            }`}
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationOpen(false);
            }}
            title="프로필"
          >
            <User size={20} />
          </button>

          {profileOpen ? (
            <div className="absolute right-0 mt-3 w-72 rounded-[24px] border border-slate-200 bg-white p-4 text-slate-950 shadow-soft">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-950">
                  <User size={34} />
                </div>
                <div className="min-w-0">
                  <strong className="block truncate text-lg font-black">{userHandle}</strong>
                  <span className="block truncate text-sm font-bold text-slate-500">{session.user.username}</span>
                </div>
              </div>

              <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-black">보유 포인트</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{balance.toLocaleString()}P 사용 가능</p>
              </div>

              <div className="grid gap-2">
                <MenuButton icon={<Bell size={17} />} label="알림" onClick={() => setNotificationOpen(true)} />
                <MenuButton icon={<User size={17} />} label="내 정보" onClick={() => onNavigate("profile")} />
                <MenuButton icon={<LogOut size={17} />} label="로그아웃" onClick={onLogout} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function MenuButton(props: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-3 rounded-2xl bg-brand-700 px-4 text-sm font-black text-white transition hover:bg-brand-800"
      onClick={props.onClick}
    >
      {props.icon}
      {props.label}
    </button>
  );
}
