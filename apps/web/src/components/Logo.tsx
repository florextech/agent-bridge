import { ChatCircleDots, Lightning } from '@phosphor-icons/react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'size-7' : size === 'lg' ? 'size-12' : 'size-9';
  const icon = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;

  return (
    <div className={`${s} rounded-xl bg-[linear-gradient(135deg,var(--brand-700),var(--brand-500))] flex items-center justify-center relative shadow-[0_0_12px_rgb(189_241_70/0.3)]`}>
      <ChatCircleDots size={icon} weight="fill" className="text-[#111513]" />
      <Lightning size={icon * 0.5} weight="fill" className="text-[#111513] absolute -top-0.5 -right-0.5" />
    </div>
  );
}
