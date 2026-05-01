import { ChatCircleDots, Lightning } from '@phosphor-icons/react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'size-7', md: 'size-9', lg: 'size-12' }[size];
  const iconSize = { sm: 15, md: 20, lg: 26 }[size];
  const boltSize = { sm: 8, md: 10, lg: 14 }[size];

  return (
    <div className={`${dims} rounded-[10px] bg-[linear-gradient(145deg,var(--brand-600),var(--brand-300))] flex items-center justify-center relative`}>
      <ChatCircleDots size={iconSize} weight="fill" className="text-[#0b0d0c]" />
      <div className="absolute -top-[3px] -right-[3px] size-[14px] rounded-full bg-(--bg) flex items-center justify-center">
        <Lightning size={boltSize} weight="fill" className="text-(--brand-600)" />
      </div>
    </div>
  );
}
