import { Bell, Loader2, Search, Sparkles, User } from "lucide-react";

interface TopbarProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export function Topbar({ isLoading, onRefresh }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
      <div className="flex items-center gap-2 lg:hidden">
        <Sparkles className="text-brand-600" size={24} />
        <span className="text-xl font-black">IdeaFlow</span>
      </div>
      <div className="hidden items-center gap-3 rounded-full bg-slate-50 px-4 py-2 text-sm font-bold text-slate-500 lg:flex">
        <Search size={18} />
        아이디어, 카테고리, 키워드 검색
      </div>
      <div className="ml-auto flex items-center gap-3 text-brand-700">
        <button className="grid h-10 w-10 place-items-center rounded-full hover:bg-brand-50" onClick={onRefresh}>
          {isLoading ? <Loader2 className="spin" size={20} /> : <Search size={20} />}
        </button>
        <button className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-brand-50">
          <Bell size={20} />
          <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] font-black text-white">
            3
          </span>
        </button>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-brand-700">
          <User size={20} />
        </button>
      </div>
    </header>
  );
}
