import { LocaleSwitcher } from '@/components/LocaleSwitcher';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute top-4 right-4"><LocaleSwitcher /></div>
      {children}
    </div>
  );
}
