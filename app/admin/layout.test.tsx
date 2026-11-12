import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ensureBasicUser } from '../../lib/profile';
import AdminLayout from './layout';

jest.mock('next/navigation', () => ({ usePathname: () => '/admin/verification' }));
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(), currentUser: jest.fn() }));
const signOutMock = jest.fn();
jest.mock('@clerk/nextjs', () => ({ useClerk: () => ({ signOut: signOutMock }) }));
jest.mock('../../lib/profile', () => ({ ensureBasicUser: jest.fn() }));

const authMock = auth as unknown as jest.Mock;
const currentUserMock = currentUser as unknown as jest.Mock;
const ensureBasicUserMock = ensureBasicUser as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

/** The layout is a server component, so it is awaited before the client tree is rendered */
const renderLayout = async () => render(await AdminLayout({ children: 'page body' }));

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'user_admin' });
  currentUserMock.mockResolvedValue({
    firstName: 'Joe',
    lastName: 'Lam',
    primaryEmailAddress: { emailAddress: 'joeulam345@gmail.com' },
    emailAddresses: [{ emailAddress: 'joeulam345@gmail.com' }],
  });
});

describe('AdminLayout', () => {
  it('shows the current section with a sidebar of all sections', async () => {
    await renderLayout();

    expect(screen.getByRole('heading', { name: 'Verification' })).toBeInTheDocument();
    expect(screen.getByText('Check who people say they are.')).toBeInTheDocument();
    expect(screen.getByText('page body')).toBeInTheDocument();

    const sidebar = screen.getByRole('navigation', { name: 'Admin sections' });
    expect(within(sidebar).getByRole('link', { name: 'Verification' })).toHaveAttribute('aria-current', 'page');
    expect(within(sidebar).getByRole('link', { name: 'Inbox' })).toHaveAttribute('href', '/admin');
    expect(screen.queryByRole('link', { name: /back to the app/i })).not.toBeInTheDocument();
  });

  it('opens the same sections from ☰ for small screens', async () => {
    await renderLayout();

    await userEvent.click(screen.getByRole('button', { name: 'Open admin menu' }));

    const [, panel] = screen.getAllByRole('navigation', { name: 'Admin sections' });
    expect(within(panel).getByRole('link', { name: 'Accounts' })).toHaveAttribute('href', '/admin/accounts');
    expect(within(panel).getByRole('link', { name: 'Verification' })).toHaveAttribute('aria-current', 'page');
  });

  it('signs the admin out from the sidebar and from the phone menu', async () => {
    await renderLayout();

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOutMock).toHaveBeenCalledWith({ redirectUrl: '/' });

    await userEvent.click(screen.getByRole('button', { name: 'Open admin menu' }));
    expect(screen.getAllByRole('button', { name: 'Sign out' })).toHaveLength(2);
  });

  it('stores the basics from Clerk instead of sending admins to onboarding', async () => {
    await renderLayout();

    expect(ensureBasicUserMock).toHaveBeenCalledWith('user_admin', {
      email: 'joeulam345@gmail.com',
      firstName: 'Joe',
      lastName: 'Lam',
    });
  });

  it('still renders when the basic info cannot be stored', async () => {
    ensureBasicUserMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await renderLayout();

    expect(screen.getByText('page body')).toBeInTheDocument();
    expect(consoleMock).toHaveBeenCalled();
  });
});
