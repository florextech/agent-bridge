'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Alert, Button, Heading, Input, Label, Text } from '@florexlabs/ui';
import { bridgeApi } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    bridgeApi.getUserCount().then((r) => { if (r.count === 0) setNeedsSetup(true); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (needsSetup) window.location.href = '/setup';
  }, [needsSetup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) {
      setError('Invalid credentials');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <><div className="flx-card w-full max-w-sm">
      <div className="flex items-center gap-2.5 mb-6">
        <span className="size-8 rounded-lg bg-(--brand-600) flex items-center justify-center text-[#111513] text-sm font-bold">AB</span>
        <Heading as="h1" size="md">Agent Bridge</Heading>
      </div>
      <Text variant="muted" size="sm" className="mb-6">Sign in to access the dashboard.</Text>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button type="submit">Sign In</Button>
      </form>
    </div></>
  );
}
