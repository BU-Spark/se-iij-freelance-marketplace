import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

const mockSignOut = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: mockSignOut }),
}));

describe('Header', () => {
  beforeEach(() => mockSignOut.mockClear());

  it('opens the menu from the ☰ button', async () => {
    render(<Header />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /roster/i })).toBeInTheDocument();
  });

  it('closes the menu with ✕', async () => {
    render(<Header />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close Menu' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches the action button when working as freelancer', async () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: /new assignment/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('radio', { name: /freelancer/i }));

    expect(screen.getByRole('button', { name: /make a pitch/i })).toBeInTheDocument();
  });

  it('signs out from the menu', async () => {
    render(<Header />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: '/' });
  });
});
