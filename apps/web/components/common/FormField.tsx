import type { ReactNode } from "react";

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-600">
      {label}
      {children}
    </label>
  );
}
