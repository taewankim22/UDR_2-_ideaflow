import { useEffect, useMemo, useRef, useState } from "react";
import type { IdeaCard, IdeaDetail } from "@ideaflow/shared/types";
import { Coins, FileText, Heart, Loader2, Lock, MessageCircle, Search, User } from "lucide-react";
import type { FeedTab } from "../../types/app";
import { TabButton } from "../../components/common/TabButton";
import { categoryLabels, formatDate, getCoverStyle } from "../../lib/uiConfig";

interface FeedViewProps {
  mode: "home" | "explore";
  feedTab: FeedTab;
  setFeedTab: (tab: FeedTab) => void;
  ideas: IdeaCard[];
  selectedIdea: IdeaDetail | null;
  isOwnIdea: (idea: IdeaCard | IdeaDetail | null) => boolean;
  balance: number;
  onSelect: (id: string) => Promise<void>;
  onUnlock: () => Promise<void>;
  onLike: (id: string) => Promise<void>;
  onOpenWhiteboard: () => void;
  onOpenAI: () => void;
}

const PAGE_SIZE = 9;

export function FeedView(props: FeedViewProps) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isExplore = props.mode === "explore";

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [props.feedTab, query]);

  const filteredIdeas = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return props.ideas;

    return props.ideas.filter((idea) =>
      [idea.title, idea.oneLine, idea.authorName, categoryLabels[idea.category], idea.category]
        .join(" ")
        .toLowerCase()
        .includes(trimmed)
    );
  }, [props.ideas, query]);

  const pagedIdeas = filteredIdeas.slice(0, visibleCount);
  const hasMore = visibleCount < filteredIdeas.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredIdeas.length));
        }
      },
      { rootMargin: "520px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredIdeas.length, hasMore]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0">
        {!isExplore ? (
          <div className="mb-5 overflow-x-auto rounded-[24px] border border-slate-200 bg-white px-4 py-5 shadow-card">
            <div className="flex min-w-max items-center gap-8">
              <StoryAvatar label="내 피드" active image="/profile-avatar.png" />
              {props.ideas.slice(0, 7).map((idea, index) => (
                <StoryAvatar key={idea.id} label={idea.authorName || `사용자 ${index + 1}`} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <TabButton active={props.feedTab === "recommended"} onClick={() => props.setFeedTab("recommended")}>
              추천
            </TabButton>
            <TabButton active={props.feedTab === "latest"} onClick={() => props.setFeedTab("latest")}>
              최신
            </TabButton>
            <TabButton active={props.feedTab === "following"} onClick={() => props.setFeedTab("following")}>
              팔로잉
            </TabButton>
          </div>
          <p className="text-sm font-bold text-slate-500">
            {isExplore ? "탐색" : "피드"} · {pagedIdeas.length}/{filteredIdeas.length}개
          </p>
        </div>

        <label className="mb-5 flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm">
          <Search size={18} className="text-brand-600" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="아이디어 제목, 작성자, 카테고리 검색"
          />
        </label>

        {pagedIdeas.length > 0 ? (
          <>
            <div className="columns-1 gap-5 md:columns-2 2xl:columns-3">
              {pagedIdeas.map((idea, index) => (
                <IdeaMasonryCard
                  key={idea.id}
                  idea={idea}
                  selectedIdea={props.selectedIdea}
                  isOwn={props.isOwnIdea(idea)}
                  index={index}
                  onSelect={props.onSelect}
                  onUnlock={props.onUnlock}
                  onLike={props.onLike}
                  onOpenWhiteboard={props.onOpenWhiteboard}
                  onOpenAI={props.onOpenAI}
                />
              ))}
            </div>
            <div ref={sentinelRef} className="grid h-16 place-items-center text-sm font-black text-slate-400">
              {hasMore ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="spin" size={16} />
                  스크롤하면 더 불러옵니다
                </span>
              ) : (
                "마지막 아이디어입니다"
              )}
            </div>
          </>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm font-bold text-slate-500">
            표시할 아이디어가 없습니다.
          </div>
        )}
      </section>

      <aside className="grid content-start gap-5">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-500">
              <Coins size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-500">보유 포인트</p>
              <strong className="text-3xl font-black">{props.balance.toLocaleString()}P</strong>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-center text-xs font-black">
            <div className="rounded-2xl bg-brand-50 px-3 py-3 text-brand-700">작성 +10P</div>
            <div className="rounded-2xl bg-red-50 px-3 py-3 text-red-600">평가 -5P</div>
          </div>
        </div>

        <IdeaSideDetail
          idea={props.selectedIdea}
          isOwn={props.isOwnIdea(props.selectedIdea)}
          onUnlock={props.onUnlock}
          onOpenWhiteboard={props.onOpenWhiteboard}
          onOpenAI={props.onOpenAI}
        />
      </aside>
    </div>
  );
}

function StoryAvatar({ label, active, image }: { label: string; active?: boolean; image?: string }) {
  return (
    <button className="grid justify-items-center gap-2 text-center text-sm font-bold text-brand-700">
      <span
        className={`grid h-16 w-16 place-items-center overflow-hidden rounded-full border ${
          active ? "border-brand-500 bg-white p-1" : "border-brand-200 bg-brand-100"
        }`}
      >
        {image ? <img src={image} alt="" className="h-full w-full rounded-full object-cover" /> : <User className="text-white" size={34} />}
      </span>
      {label}
    </button>
  );
}

function IdeaMasonryCard(props: {
  idea: IdeaCard;
  selectedIdea: IdeaDetail | null;
  isOwn: boolean;
  index: number;
  onSelect: (id: string) => Promise<void>;
  onUnlock: () => Promise<void>;
  onLike: (id: string) => Promise<void>;
  onOpenWhiteboard: () => void;
  onOpenAI: () => void;
}) {
  const expanded = props.selectedIdea?.id === props.idea.id;
  const visualHeight = props.index % 3 === 0 ? "h-56" : props.index % 3 === 1 ? "h-44" : "h-64";

  return (
    <article className="mb-5 break-inside-avoid overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-card">
      <button className="block w-full text-left" onClick={() => void props.onSelect(props.idea.id)}>
        <div className={`${visualHeight} relative bg-cover bg-center`} style={getCoverStyle(props.idea)}>
          <span className="absolute right-4 top-4 rounded-full bg-slate-950/85 px-3 py-2 text-xs font-black text-white">
            {props.idea.coverImageUrl ? "커버 이미지" : "기본 이미지"}
          </span>
          <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-2 text-xs font-black text-brand-700 backdrop-blur">
            {categoryLabels[props.idea.category]}
          </span>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200" />
            <div>
              <strong className="block text-sm font-black">{props.idea.authorName}</strong>
              <span className="text-xs font-semibold text-slate-400">{formatDate(props.idea.createdAt)}</span>
            </div>
          </div>
          <h2 className="text-lg font-black leading-snug">{props.idea.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{props.idea.oneLine}</p>

          {expanded && props.selectedIdea ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {props.selectedIdea.isUnlocked ? (
                <>
                  <p>
                    <strong className="text-slate-950">문제 </strong>
                    {props.selectedIdea.problem}
                  </p>
                  <p className="mt-2">
                    <strong className="text-slate-950">해결 </strong>
                    {props.selectedIdea.solution}
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-500">본문은 잠겨 있습니다.</span>
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-3 text-xs font-black text-white"
                    onClick={(event) => {
                      event.stopPropagation();
                      void props.onUnlock();
                    }}
                  >
                    <Lock size={14} />
                    {props.idea.unlockCost}P 열기
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs font-bold text-slate-500">
        <div className="flex items-center gap-4">
          <button
            className="inline-flex items-center gap-1 rounded-xl px-2 py-1 hover:bg-red-50 hover:text-red-500"
            onClick={() => void props.onLike(props.idea.id)}
          >
            <Heart size={15} />
            {props.idea.likeCount}
          </button>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={15} />
            {props.idea.commentCount}
          </span>
        </div>
        {props.isOwn ? (
          <div className="flex items-center gap-2">
            <button className="rounded-xl bg-brand-50 px-3 py-2 text-brand-700" onClick={props.onOpenWhiteboard}>
              보드
            </button>
            <button className="rounded-xl bg-slate-950 px-3 py-2 text-white" onClick={props.onOpenAI}>
              평가
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function IdeaSideDetail(props: {
  idea: IdeaDetail | null;
  isOwn: boolean;
  onUnlock: () => Promise<void>;
  onOpenWhiteboard: () => void;
  onOpenAI: () => void;
}) {
  if (!props.idea) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-card">
        <FileText className="mx-auto text-brand-500" size={32} />
        <p className="mt-3 text-sm font-bold text-slate-500">카드를 선택하면 상세가 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">
          {categoryLabels[props.idea.category]}
        </span>
        <span className="text-xs font-bold text-slate-400">{formatDate(props.idea.createdAt)}</span>
      </div>
      <h2 className="text-xl font-black leading-tight">{props.idea.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{props.idea.oneLine}</p>

      {!props.idea.isUnlocked ? (
        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 font-black text-white"
          onClick={() => void props.onUnlock()}
        >
          <Lock size={17} />
          {props.idea.unlockCost}P로 본문 열기
        </button>
      ) : (
        <div className="mt-5 grid gap-3 text-sm leading-6">
          <p className="rounded-2xl bg-slate-50 p-4">
            <strong>문제 </strong>
            {props.idea.problem}
          </p>
          <p className="rounded-2xl bg-slate-50 p-4">
            <strong>해결 </strong>
            {props.idea.solution}
          </p>
        </div>
      )}

      {props.isOwn ? (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="h-10 rounded-xl bg-brand-50 text-sm font-black text-brand-700" onClick={props.onOpenWhiteboard}>
            화이트보드
          </button>
          <button className="h-10 rounded-xl bg-slate-950 text-sm font-black text-white" onClick={props.onOpenAI}>
            AI 평가
          </button>
        </div>
      ) : null}
    </div>
  );
}
