'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Alert, Button, Heading, Input, Label, Text } from '@florexlabs/ui';
import { useI18n } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { bridgeApi } from '@/lib/api';

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    bridgeApi.getUserCount().then((r) => { if (r.count === 0) setNeedsSetup(true); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (needsSetup) globalThis.location.href = '/setup';
  }, [needsSetup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) {
      setError(t('auth.invalidCredentials'));
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="flx-card w-full max-w-sm">
      <div className="flex items-center gap-2.5 mb-6">
        <Logo size="sm" />
        <Heading as="h1" size="md">{t('common.appName')}</Heading>
      </div>
      <Text variant="muted" size="sm" className="mb-6">{t('auth.signInDesc')}</Text>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input id="email" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input id="password" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button type="submit">{t('auth.signIn')}</Button>
      </form>
    </div>
  );
}
