'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Alert, Button, Heading, Input, Label, Text } from '@florexlabs/ui';
import { Shield } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { bridgeApi } from '@/lib/api';

export default function SetupPage() {
  const { t } = useI18n();
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bridgeApi.getUserCount().then((r) => {
      if (r.count > 0) window.location.href = '/login';
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await bridgeApi.setupAdmin(form);
      const res = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (res?.error) setError('Account created but login failed. Go to /login.');
      else window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    }
  };

  if (loading) return null;

  return (
    <><div className="flx-card w-full max-w-sm">
      <div className="flex items-center gap-2.5 mb-6">
        <Logo size="sm" />
        <Heading as="h1" size="md">{t('auth.setupAdmin')}</Heading>
      </div>
      <Text variant="muted" size="sm" className="mb-6">{t('auth.setupDesc')}</Text>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t('auth.name')}</Label>
          <Input id="name" value={form.name} onChange={set('auth.name')} autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" type="email" value={form.email} onChange={set('auth.email')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input id="password" type="password" value={form.password} onChange={set('auth.password')} />
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button type="submit">{t('auth.createAdmin')}</Button>
      </form>
    </div></>
  );
}
