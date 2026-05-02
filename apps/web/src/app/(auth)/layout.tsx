import { LocaleSwitcher } from '@/components/LocaleSwitcher';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      <div className="absolute top-5 right-5"><LocaleSwitcher /></div>
      <div className="w-full max-w-[380px]">{children}</div>
    </div>
  );
}
