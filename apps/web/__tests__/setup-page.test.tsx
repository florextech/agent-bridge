import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock window.location
Object.defineProperty(window, 'location', { value: { href: '' }, writable: true });

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }));
vi.mock('@/lib/api', () => ({
  bridgeApi: { getUserCount: vi.fn().mockResolvedValue({ count: 0 }), setupAdmin: vi.fn() },
}));
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({ t: (k: string) => k, locale: 'en', toggle: () => {} }),
}));
vi.mock('@phosphor-icons/react', () => ({ Shield: () => React.createElement('span') }));
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

import SetupPage from '@/app/(auth)/setup/page';

describe('SetupPage', () => {
  it('renders inputs after loading', async () => {
    render(<SetupPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('Input')).toHaveLength(3);
    });
  });

  it('renders create admin button after loading', async () => {
    render(<SetupPage />);
    await waitFor(() => {
      expect(screen.getByTestId('Button')).toBeInTheDocument();
    });
  });
});
