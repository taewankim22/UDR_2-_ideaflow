import type { ReactNode } from "react";

export function EmptyState({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <section className="grid min-h-[520px] place-items-center rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-card">
      <div>
        {icon}
        <h2 className="mt-4 text-2xl font-black">{title}</h2>
      </div>
    </section>
  );
}
