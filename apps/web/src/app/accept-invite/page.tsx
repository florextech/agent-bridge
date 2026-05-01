'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Alert, Button, Heading, Input, Label, Text } from '@florexlabs/ui';
import { UserPlus } from '@phosphor-icons/react';
import { bridgeApi } from '@/lib/api';

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ name: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await bridgeApi.acceptInvite({ token, name: form.name, password: form.password });
      setSuccess(true);
      const res = await signIn('credentials', { email: user.email, password: form.password, redirect: false });
      if (!res?.error) window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flx-card w-full max-w-sm">
          <Alert variant="danger">Missing invitation token.</Alert>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flx-card w-full max-w-sm">
          <Alert variant="success">Account created! Redirecting...</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flx-card w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="size-8 rounded-lg bg-(--brand-600) flex items-center justify-center">
            <UserPlus size={18} weight="bold" className="text-[#111513]" />
          </div>
          <Heading as="h1" size="md">Accept Invitation</Heading>
        </div>
        <Text variant="muted" size="sm" className="mb-6">Create your Agent Bridge account.</Text>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={set('name')} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={set('password')} />
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          <Button type="submit">Create Account</Button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteForm />
    </Suspense>
  );
}
