import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ProfileFromUrl from './ProfileFromUrl';
import { ToastProvider } from '../Toast/ToastProvider';
import { MOCK_PROFILE } from './config/constants';

const mockStore = jest.fn();

jest.mock('../../hooks/useProfile', () => ({
  useProfile: () => mockStore(),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('panel=profile'),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

const renderPanel = () =>
  render(
    <ToastProvider>
      <ProfileFromUrl closeHref="/dashboard" />
    </ToastProvider>
  );

/** The panel plus the toast region both expose role="status", so look inside the dialog */
const panelStatus = () => within(screen.getByRole('dialog', { name: 'My profile' })).getByRole('status');

const store = (overrides: Record<string, unknown> = {}) => ({
  profile: null,
  loading: false,
  error: null,
  needsOnboarding: false,
  refresh: jest.fn(),
  saveBasic: jest.fn(),
  saveRole: jest.fn(),
  saveAvailableNow: jest.fn(),
  ...overrides,
});

describe('ProfileFromUrl', () => {
  beforeEach(() => mockStore.mockReset());

  it('points people with no profile at onboarding instead of dead-ending', () => {
    mockStore.mockReturnValue(store({ needsOnboarding: true }));

    renderPanel();

    expect(screen.getByRole('dialog', { name: 'My profile' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /finish setting up your profile/i })).toHaveAttribute(
      'href',
      '/onboarding'
    );
  });

  it('re-checks the profile when it opens on a missing one', () => {
    const refresh = jest.fn();
    mockStore.mockReturnValue(store({ needsOnboarding: true, refresh }));

    renderPanel();

    expect(refresh).toHaveBeenCalled();
  });

  it('shows the loading state rather than the setup prompt', () => {
    mockStore.mockReturnValue(store({ needsOnboarding: true, loading: true }));

    renderPanel();

    expect(panelStatus()).toHaveTextContent(/loading your profile/i);
    expect(screen.queryByRole('link', { name: /finish setting up/i })).not.toBeInTheDocument();
  });

  it('shows a load failure', () => {
    mockStore.mockReturnValue(store({ error: 'Unable to load your profile right now.' }));

    renderPanel();

    expect(panelStatus()).toHaveTextContent(/unable to load your profile/i);
  });

  it('saves the free-right-now flag and says so', async () => {
    const saveAvailableNow = jest.fn().mockResolvedValue(true);
    mockStore.mockReturnValue(store({ profile: MOCK_PROFILE, saveAvailableNow }));

    renderPanel();
    fireEvent.click(screen.getByRole('switch', { name: /free right now/i }));

    await waitFor(() => expect(saveAvailableNow).toHaveBeenCalledWith(false));
    expect(await screen.findByText(/no longer marked as free/i)).toBeInTheDocument();
  });

  it('renders the panel when there is a profile', () => {
    mockStore.mockReturnValue(store({ profile: MOCK_PROFILE }));

    renderPanel();

    expect(screen.getByText('Marcus Thorne')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Basic info' }));
    expect(screen.getByRole('button', { name: 'Edit basic info' })).toBeInTheDocument();
  });
});
