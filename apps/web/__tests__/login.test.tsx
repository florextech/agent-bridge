import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }));
vi.mock('@/lib/api', () => ({
  bridgeApi: { getUserCount: vi.fn().mockResolvedValue({ count: 1 }) },
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/components/Logo', () => ({ Logo: () => React.createElement('span', null, 'logo') }));
vi.mock('@florexlabs/ui', async () => {
  const R = await import('react');
  const c = (name: string) => R.forwardRef(({ children, ...props }: any, ref: any) =>
    R.createElement('div', { ...props, ref, 'data-testid': name }, children));
  return {
    Button: c('Button'), Input: c('Input'), Label: c('Label'),
    Heading: c('Heading'), Text: c('Text'), Alert: c('Alert'),
  };
});

import LoginPage from '@/app/(auth)/login/page';

describe('LoginPage', () => {
  it('renders email and password inputs', () => {
    render(<LoginPage />);
    expect(screen.getAllByTestId('Input')).toHaveLength(2);
  });

  it('renders sign in button', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('Button')).toBeInTheDocument();
  });
});
