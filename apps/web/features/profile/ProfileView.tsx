import type { ReactNode } from "react";
import type { AuthSession, IdeaCard, PointSummary } from "@ideaflow/shared/types";
import {
  Calendar,
  Camera,
  ChevronRight,
  Coins,
  Compass,
  Heart,
  Lightbulb,
  Link2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Rocket,
  ShieldCheck,
  Star,
  Trophy,
  WalletCards,
  Zap
} from "lucide-react";
import { categoryTags, formatDate, formatPoint, getCoverStyle } from "../../lib/uiConfig";

interface ProfileViewProps {
  session: AuthSession;
  ideas: IdeaCard[];
  ownIdeas: IdeaCard[];
  summary: PointSummary | null;
  onOpenIdea: (id: string) => void;
}

export function ProfileView(props: ProfileViewProps) {
  const balance = props.summary?.user.pointsBalance ?? props.session.user.pointsBalance;
  const liked = props.ideas.reduce((sum, idea) => sum + idea.likeCount, 0);
  const comments = props.ideas.reduce((sum, idea) => sum + idea.commentCount, 0);

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
      <div className="grid gap-6">
        <div className="relative overflow-hidden rounded-[28px] bg-brand-200 p-8 shadow-card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,.75),transparent_20%),radial-gradient(circle_at_10%_90%,rgba(108,76,241,.35),transparent_30%)]" />
          <div className="relative flex flex-wrap items-center gap-7">
            <div className="relative">
              <img
                className="h-40 w-40 rounded-full border-4 border-white object-cover shadow-soft"
                src="/profile-avatar.png"
                alt=""
              />
              <button className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white shadow-card">
                <Camera size={18} />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black">{props.session.user.username}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-2 text-xs font-black text-white">
                  <Zap size={13} />
                  PRO
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-slate-700">@{props.session.user.email.split("@")[0]}</p>
              <p className="mt-4 font-semibold text-slate-700">새로운 아이디어로 세상을 바꾸고 싶어요.</p>
              <div className="mt-6 flex flex-wrap gap-5 text-sm font-bold text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <MapPin size={16} />
                  서울, 대한민국
                </span>
                <span className="inline-flex items-center gap-2">
                  <Calendar size={16} />
                  가입일 2024.03.15
                </span>
                <span className="inline-flex items-center gap-2">
                  <Link2 size={16} />
                  idea-kim.dev
                </span>
              </div>
            </div>
            <button className="rounded-2xl bg-white px-8 py-3 text-sm font-black shadow-sm">프로필 편집</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <ProfileStat icon={<Lightbulb size={22} />} label="전체 아이디어" value={props.ownIdeas.length} />
          <ProfileStat icon={<Rocket size={22} />} label="진행 중인 프로젝트" value={props.ownIdeas.length} />
          <ProfileStat icon={<Heart size={22} />} label="받은 좋아요" value={liked} />
          <ProfileStat icon={<MessageCircle size={22} />} label="받은 댓글" value={comments} />
          <ProfileStat icon={<Star size={22} />} label="보유 포인트" value={`${balance.toLocaleString()}P`} />
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black">내 프로젝트</h2>
            <button className="inline-flex items-center gap-2 text-sm font-black text-slate-500">
              전체 보기
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {(props.ownIdeas.length ? props.ownIdeas : props.ideas.slice(0, 4)).map((idea) => (
              <button
                key={idea.id}
                className="grid w-full grid-cols-[92px_1fr_auto_auto] items-center gap-4 px-6 py-4 text-left hover:bg-slate-50"
                onClick={() => props.onOpenIdea(idea.id)}
              >
                <div className="h-16 rounded-2xl bg-cover bg-center" style={getCoverStyle(idea)} />
                <div className="min-w-0">
                  <strong className="block truncate font-black">{idea.title}</strong>
                  <p className="truncate text-sm font-semibold text-slate-500">{idea.oneLine}</p>
                  <div className="mt-2 flex gap-2">
                    {categoryTags[idea.category].slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-brand-50 px-2 py-1 text-xs font-black text-brand-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-600">
                  진행 중
                </span>
                <MoreHorizontal size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="grid content-start gap-6">
        <ProfilePanel title="최근 활동">
          <div className="grid gap-4">
            {(props.summary?.transactions.length ? props.summary.transactions : []).slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Coins size={17} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {item.reason} · {formatPoint(item.delta)}
                  </p>
                  <span className="text-xs font-semibold text-slate-400">{formatDate(item.createdAt)}</span>
                </div>
              </div>
            ))}
            {!props.summary?.transactions.length ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                아직 기록된 활동이 없습니다.
              </p>
            ) : null}
          </div>
        </ProfilePanel>

        <ProfilePanel title="나의 배지">
          <div className="grid grid-cols-4 gap-4 text-center">
            <Badge icon={<ShieldCheck size={24} />} label="아이디어 메이커" />
            <Badge icon={<Lightbulb size={24} />} label="인사이트 헌터" />
            <Badge icon={<Trophy size={24} />} label="인기 크리에이터" />
            <Badge icon={<Compass size={24} />} label="성실한 탐색가" />
          </div>
        </ProfilePanel>

        <ProfilePanel title="포인트 현황">
          <div className="flex items-center justify-between rounded-2xl bg-brand-50 p-5">
            <div>
              <p className="text-sm font-black text-brand-700">현재 포인트</p>
              <strong className="text-3xl font-black">{balance.toLocaleString()}P</strong>
            </div>
            <WalletCards className="text-brand-600" size={34} />
          </div>
        </ProfilePanel>
      </aside>
    </section>
  );
}

function ProfileStat({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600">{icon}</div>
      <strong className="block text-2xl font-black">{value}</strong>
      <span className="text-xs font-bold text-slate-500">{label}</span>
    </div>
  );
}

function ProfilePanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-black">{title}</h2>
        <button className="inline-flex items-center gap-1 text-xs font-black text-slate-400">
          전체 보기
          <ChevronRight size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}

function Badge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="grid justify-items-center gap-2">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-600 ring-4 ring-brand-50">
        {icon}
      </span>
      <span className="text-xs font-black leading-tight text-slate-600">{label}</span>
    </div>
  );
}
