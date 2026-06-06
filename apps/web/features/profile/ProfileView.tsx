import type { ReactNode } from "react";
import type { AuthSession, IdeaCard, PointSummary } from "@ideaflow/shared/types";
import { Calendar, Camera, ChevronRight, Coins, Heart, Lightbulb, MessageCircle, Rocket, Star, WalletCards } from "lucide-react";
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
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid gap-6">
        <div className="relative overflow-hidden rounded-[24px] bg-brand-100 p-8 shadow-card">
          <div className="relative flex flex-wrap items-center gap-7">
            <div className="relative">
              <img className="h-36 w-36 rounded-full border-4 border-white object-cover shadow-soft" src="/profile-avatar.png" alt="" />
              <button className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white shadow-card">
                <Camera size={18} />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-black">{props.session.user.username}</h1>
              <p className="mt-2 text-lg font-bold text-slate-700">@{props.session.user.email.split("@")[0]}</p>
              <p className="mt-4 font-semibold text-slate-700">새로운 아이디어를 쓰고 검증하는 메이커입니다.</p>
              <div className="mt-6 flex flex-wrap gap-5 text-sm font-bold text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <Calendar size={16} />
                  가입일 2026.06.06
                </span>
              </div>
            </div>
            <button className="rounded-2xl bg-white px-8 py-3 text-sm font-black shadow-sm">프로필 편집</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <ProfileStat icon={<Lightbulb size={22} />} label="내 아이디어" value={props.ownIdeas.length} />
          <ProfileStat icon={<Rocket size={22} />} label="진행 중" value={props.ownIdeas.length} />
          <ProfileStat icon={<Heart size={22} />} label="받은 좋아요" value={liked} />
          <ProfileStat icon={<MessageCircle size={22} />} label="받은 댓글" value={comments} />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-black">내 프로젝트</h2>
            <span className="text-sm font-black text-slate-500">{props.ownIdeas.length}개</span>
          </div>
          <div className="divide-y divide-slate-100">
            {(props.ownIdeas.length ? props.ownIdeas : props.ideas.slice(0, 4)).map((idea) => (
              <button
                key={idea.id}
                className="grid w-full grid-cols-[92px_1fr_auto] items-center gap-4 px-6 py-4 text-left hover:bg-slate-50"
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
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="grid content-start gap-6">
        <ProfilePanel title="포인트 현황">
          <div className="flex items-center justify-between rounded-2xl bg-brand-50 p-5">
            <div>
              <p className="text-sm font-black text-brand-700">현재 포인트</p>
              <strong className="text-3xl font-black">{balance.toLocaleString()}P</strong>
            </div>
            <WalletCards className="text-brand-600" size={34} />
          </div>
        </ProfilePanel>

        <ProfilePanel title="최근 활동">
          <div className="grid gap-4">
            {(props.summary?.transactions ?? []).slice(0, 6).map((item) => (
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
              <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">아직 포인트 활동이 없습니다.</p>
            ) : null}
          </div>
        </ProfilePanel>

        <ProfilePanel title="레벨">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            <Star className="fill-amber-400 text-amber-400" size={28} />
            <div>
              <strong className="block font-black">Idea Maker</strong>
              <span className="text-sm font-bold text-slate-500">아이디어 작성과 평가로 성장 중</span>
            </div>
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
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}
