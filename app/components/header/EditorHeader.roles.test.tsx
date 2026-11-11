import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorHeader } from './EditorHeader';
import { useProfile } from '../../hooks/useProfile';
import { MOCK_PROFILE } from '../Profile/config/constants';
import type { AccountProfile, ProfileRole } from '../../types/profile.types';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));
jest.mock('@clerk/nextjs', () => ({ useClerk: () => ({ signOut: jest.fn() }) }));
jest.mock('../../hooks/useProfile', () => ({ useProfile: jest.fn() }));

const useProfileMock = useProfile as jest.Mock;

/** The sample profile, trimmed down to the roles this person actually holds */
const profileWith = (...roles: ProfileRole[]): AccountProfile => ({
  ...MOCK_PROFILE,
  roles: MOCK_PROFILE.roles.filter((details) => roles.includes(details.role)),
});

const signedInAs = (...roles: ProfileRole[]) => {
  useProfileMock.mockReturnValue({
    profile: profileWith(...roles),
    loading: false,
    error: null,
    needsOnboarding: false,
    refresh: jest.fn(),
    saveBasic: jest.fn(),
    saveRole: jest.fn(),
    saveAvailableNow: jest.fn(),
  });
};

describe('EditorHeader workspaces', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('offers only the editor side to people who only have the editor role', async () => {
    signedInAs('editor');
    render(<EditorHeader />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /roster/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /available assignments/i })).not.toBeInTheDocument();
  });

  it('offers only the freelancer side to people who only have the freelancer role', async () => {
    signedInAs('freelancer');
    render(<EditorHeader initialRole="freelancer" />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /available assignments/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /roster/i })).not.toBeInTheDocument();
  });

  it('shows the switch when the person has both roles', async () => {
    signedInAs('freelancer', 'editor');
    render(<EditorHeader />);

    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /editor/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /freelancer/i })).toBeInTheDocument();
  });

  it('sends a freelancer-only person away from the editor desk', async () => {
    signedInAs('freelancer');
    render(<EditorHeader />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard/freelancer'));
  });

  it('sends an editor-only person away from the freelancer workspace', async () => {
    signedInAs('editor');
    render(<EditorHeader initialRole="freelancer" />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/dashboard'));
  });
});
