import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorHeader } from './EditorHeader';
import { MOCK_PROFILE } from '../Profile/config/constants';

const mockSignOut = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

jest.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: mockSignOut }),
}));

describe('EditorHeader', () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    mockPush.mockClear();
    // the header reads the signed-in user's name and roles from /api/profile
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => MOCK_PROFILE });
  });

  it('opens the menu from the ☰ button', async () => {
    render(<EditorHeader />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /roster/i })).toBeInTheDocument();
  });

  it('closes the menu with ✕', async () => {
    render(<EditorHeader />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close Menu' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches the action button when working as freelancer', async () => {
    render(<EditorHeader />);
    expect(screen.getByRole('link', { name: /new assignment/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(await screen.findByRole('radio', { name: /freelancer/i }));

    const pitchLinks = screen.getAllByRole('link', { name: /make a pitch/i });
    expect(pitchLinks).toHaveLength(1); // The header action remains; the sidebar item was removed.
    expect(pitchLinks[0]).toHaveAttribute('href', '/dashboard/freelancer/make-a-pitch');
    expect(mockPush).toHaveBeenCalledWith('/dashboard/freelancer');
  });

  it('signs out from the menu', async () => {
    render(<EditorHeader />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: '/' });
  });
});
