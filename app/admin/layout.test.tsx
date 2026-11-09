import { render, screen } from '@testing-library/react';
import AdminLayout from './layout';

jest.mock('next/navigation', () => ({ usePathname: () => '/admin/verification' }));

describe('AdminLayout', () => {
  it('shows the admin tabs around the page', () => {
    render(<AdminLayout>page body</AdminLayout>);

    expect(screen.getByRole('heading', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByText('page body')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inbox' })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: 'Accounts' })).toHaveAttribute('href', '/admin/accounts');
  });

  it('marks the current tab', () => {
    render(<AdminLayout>page body</AdminLayout>);

    expect(screen.getByRole('link', { name: 'Verification' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Inbox' })).not.toHaveAttribute('aria-current');
  });
});
