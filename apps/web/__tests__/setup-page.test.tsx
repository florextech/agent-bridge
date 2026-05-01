import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next-auth/react', () => ({ signIn: vi.fn() }));
vi.mock('@/lib/api', () => ({
  bridgeApi: { getUserCount: vi.fn().mockResolvedValue({ count: 0 }), setupAdmin: vi.fn() },
}));
vi.mock('@phosphor-icons/react', () => ({ Shield: () => null }));
vi.mock('@florexlabs/ui', async () => {
  const R = await import('react');
  const c = (name: string) => R.forwardRef(({ children, ...props }: any, ref: any) =>
    R.createElement('div', { ...props, ref, 'data-testid': name }, children));
  return {
    Button: c('Button'), Input: c('Input'), Label: c('Label'),
    Heading: c('Heading'), Text: c('Text'), Alert: c('Alert'),
  };
});

import SetupPage from '@/app/setup/page';

describe('SetupPage', () => {
  it('renders name, email, password inputs', async () => {
    render(<SetupPage />);
    await vi.waitFor(() => {
      expect(screen.getAllByTestId('Input')).toHaveLength(3);
    });
  });

  it('renders create admin button', async () => {
    render(<SetupPage />);
    await vi.waitFor(() => {
      expect(screen.getByTestId('Button')).toHaveTextContent('Create Admin Account');
    });
  });
});
