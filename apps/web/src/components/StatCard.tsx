import type { ReactNode } from 'react';

export function StatCard({ icon, label, value, accent }: { icon: ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-(--border) bg-(--surface) p-4 flex items-center gap-3">
      <div className={`size-9 rounded-lg flex items-center justify-center ${accent ? 'bg-[rgb(189_241_70/0.1)] text-(--brand-600)' : 'bg-(--surface-muted) text-(--muted)'}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold font-display text-(--foreground)">{value}</p>
        <p className="text-[11px] text-(--muted)">{label}</p>
      </div>
    </div>
  );
}
