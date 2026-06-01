import type { ReactNode } from "react";

interface TabButtonProps {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}

export function TabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      className={`h-9 rounded-xl px-4 text-sm font-black transition ${
        active ? "bg-brand-600 text-white shadow-lg shadow-brand-100" : "text-slate-500 hover:text-brand-700"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
