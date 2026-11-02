import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorHeader } from './EditorHeader';

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
  beforeEach(() => mockSignOut.mockClear());

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
    await userEvent.click(screen.getByRole('radio', { name: /freelancer/i }));

    expect(screen.getByRole('link', { name: /make a pitch/i })).toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/dashboard/freelancer');
  });

  it('signs out from the menu', async () => {
    render(<EditorHeader />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: '/' });
  });
});
