import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import SettingsLayout from './layout';

let mockPath = '/dashboard/settings';

jest.mock('next/navigation', () => ({ usePathname: () => mockPath }));
jest.mock('../../components/FreelancerWorkspace', () => ({
  FreelancerWorkspace: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const renderLayout = () =>
  render(
    <SettingsLayout>
      <p>page body</p>
    </SettingsLayout>
  );

beforeEach(() => {
  mockPath = '/dashboard/settings';
});

describe('Settings layout', () => {
  it('titles the page and draws the section links', () => {
    renderLayout();

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Settings sections' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/dashboard/settings');
    expect(screen.getByRole('link', { name: 'Sign-in & security' })).toHaveAttribute(
      'href',
      '/dashboard/settings/security'
    );
  });

  it('marks the profile section as current', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Sign-in & security' })).not.toHaveAttribute('aria-current');
  });

  it('marks the security section as current', () => {
    mockPath = '/dashboard/settings/security';

    renderLayout();

    expect(screen.getByRole('link', { name: 'Sign-in & security' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Profile' })).not.toHaveAttribute('aria-current');
  });

  it('renders one page at a time below the links', () => {
    renderLayout();

    expect(screen.getByText('page body')).toBeInTheDocument();
  });
});
