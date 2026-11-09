import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLayout from './layout';

jest.mock('next/navigation', () => ({ usePathname: () => '/admin/verification' }));

describe('AdminLayout', () => {
  it('shows the current section with a sidebar of all sections', () => {
    render(<AdminLayout>page body</AdminLayout>);

    expect(screen.getByRole('heading', { name: 'Verification' })).toBeInTheDocument();
    expect(screen.getByText('Check who people say they are.')).toBeInTheDocument();
    expect(screen.getByText('page body')).toBeInTheDocument();

    const sidebar = screen.getByRole('navigation', { name: 'Admin sections' });
    expect(within(sidebar).getByRole('link', { name: 'Verification' })).toHaveAttribute('aria-current', 'page');
    expect(within(sidebar).getByRole('link', { name: 'Inbox' })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: '← Back to the app' })).toHaveAttribute('href', '/dashboard');
  });

  it('opens the same sections from ☰ for small screens', async () => {
    render(<AdminLayout>page body</AdminLayout>);

    await userEvent.click(screen.getByRole('button', { name: 'Open admin menu' }));

    const [, panel] = screen.getAllByRole('navigation', { name: 'Admin sections' });
    expect(within(panel).getByRole('link', { name: 'Accounts' })).toHaveAttribute('href', '/admin/accounts');
    expect(within(panel).getByRole('link', { name: 'Verification' })).toHaveAttribute('aria-current', 'page');
  });
});
