import { fireEvent, render, screen } from '@testing-library/react';
import { useAuth } from '@clerk/nextjs';
import SettingsPage from './page';
import { ToastProvider } from '../../components/Toast/ToastProvider';
import { MOCK_PROFILE } from '../../components/Profile/config/constants';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));

const mockStore = jest.fn();
jest.mock('../../hooks/useProfile', () => ({
  useProfile: () => mockStore(),
}));

const auth = jest.mocked(useAuth);
const originalFetch = global.fetch;
const fetchMock = jest.fn();

const AVAILABILITY = {
  role: 'freelancer',
  availableNow: false,
  timezone: 'UTC',
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  startsAt: '09:00',
  endsAt: '17:00',
  exceptions: [],
};

const store = (overrides: Record<string, unknown> = {}) => ({
  profile: MOCK_PROFILE,
  loading: false,
  error: null,
  needsOnboarding: false,
  refresh: jest.fn(),
  saveBasic: jest.fn(),
  saveRole: jest.fn(),
  saveAvailableNow: jest.fn(),
  ...overrides,
});

const renderPage = () =>
  render(
    <ToastProvider>
      <SettingsPage />
    </ToastProvider>
  );

beforeEach(() => {
  mockStore.mockReset();
  mockStore.mockReturnValue(store());
  auth.mockReturnValue({ userId: 'user-a', isLoaded: true } as ReturnType<typeof useAuth>);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => AVAILABILITY });
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('Settings page', () => {
  it('shows the profile cards', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('Basic info')).toBeInTheDocument();
    expect(screen.getByText('My roles')).toBeInTheDocument();
  });

  it('leaves the availability editor to the role it belongs to', () => {
    renderPage();

    // the role cards keep their one-line summary, but nothing here opens the hours editor
    expect(screen.queryByText('Freelancer availability')).not.toBeInTheDocument();
    expect(screen.queryByText('Editor availability')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Time zone')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/api/profile/availability'), expect.anything());
  });

  it('edits availability from the role being edited', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Editor details' }));

    expect(screen.getByText('Editor availability')).toBeInTheDocument();
    expect(screen.queryByText('Freelancer availability')).not.toBeInTheDocument();
    expect(await screen.findByLabelText('Time zone')).toHaveValue('UTC');
    expect(fetchMock).toHaveBeenCalledWith('/api/profile/availability?role=editor', { cache: 'no-store' });
  });

  it('waits for the profile before drawing the cards', () => {
    mockStore.mockReturnValue(store({ profile: null }));

    renderPage();

    expect(screen.getByText(/loading your profile/i)).toBeInTheDocument();
    expect(screen.queryByText('Basic info')).not.toBeInTheDocument();
  });

  it('points people with no profile at onboarding', () => {
    mockStore.mockReturnValue(store({ profile: null, needsOnboarding: true }));

    renderPage();

    expect(screen.getByRole('link', { name: /finish setting up your profile/i })).toHaveAttribute(
      'href',
      '/onboarding'
    );
  });

  it('keeps the profile open for editing and saves the basic info', async () => {
    const saveBasic = jest.fn().mockResolvedValue(true);
    mockStore.mockReturnValue(store({ saveBasic }));

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Edit basic info' }));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Marina' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(/basic info saved/i)).toBeInTheDocument();
    expect(saveBasic).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Marina' }));
  });
});
