import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@clerk/nextjs';
import AvailabilityPage from './page';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));
jest.mock('../../components/FreelancerWorkspace', () => ({
  FreelancerWorkspace: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const auth = jest.mocked(useAuth);
const account = (userId: string) => auth.mockReturnValue({ userId, isLoaded: true } as ReturnType<typeof useAuth>);

const originalFetch = global.fetch;
const fetchMock = jest.fn();

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const SAVED = {
  availableNow: true,
  timezone: 'Europe/London',
  days: [...WEEKDAYS, 'saturday'],
  startsAt: '10:00',
  endsAt: '18:00',
};

const EMPTY = { availableNow: false, timezone: 'UTC', days: WEEKDAYS, startsAt: '09:00', endsAt: '17:00' };

const save = () => fireEvent.click(screen.getByRole('button', { name: /save availability/i }));

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(ok(EMPTY));
  global.fetch = fetchMock as unknown as typeof fetch;
  account('user-a');
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('Availability page', () => {
  it('starts from what was saved for this account', async () => {
    fetchMock.mockResolvedValue(ok(SAVED));
    render(<AvailabilityPage />);

    expect(await screen.findByLabelText('Time zone')).toHaveValue('Europe/London');
    expect(screen.getByLabelText(/free right now/i)).toBeChecked();
    expect(screen.getByLabelText('Start time')).toHaveValue('10:00');
    expect(screen.getByLabelText('End time')).toHaveValue('18:00');
    expect(screen.getByLabelText('Saturday')).toBeChecked();
    expect(fetchMock).toHaveBeenCalledWith('/api/profile/availability', { cache: 'no-store' });
  });

  it('saves the switch and the hours to the account', async () => {
    render(<AvailabilityPage />);
    await screen.findByLabelText('Time zone');

    fireEvent.click(screen.getByLabelText(/free right now/i));
    fireEvent.change(screen.getByLabelText('Time zone'), { target: { value: 'Europe/London' } });
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '10:00' } });
    fireEvent.click(screen.getByLabelText('Saturday'));

    fetchMock.mockResolvedValueOnce(ok({ saved: true }));
    save();

    expect(await screen.findByText(/availability saved/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith('/api/profile/availability', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        availableNow: true,
        timezone: 'Europe/London',
        days: [...WEEKDAYS, 'saturday'],
        startsAt: '10:00',
        endsAt: '17:00',
      }),
    });
  });

  it('rejects reversed times, a dayless week, and an invalid time zone', async () => {
    render(<AvailabilityPage />);
    await screen.findByLabelText('Time zone');

    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '08:00' } });
    save();
    expect(screen.getByRole('alert')).toHaveTextContent('End time must be later');
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/profile/availability',
      expect.objectContaining({ method: 'PATCH' })
    );

    fireEvent.change(screen.getByLabelText('End time'), { target: { value: '17:00' } });
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
      fireEvent.click(screen.getByLabelText(day));
    }
    save();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose at least one working day');

    // free right now is enough on its own
    fireEvent.click(screen.getByLabelText(/free right now/i));
    fireEvent.change(screen.getByLabelText('Time zone'), { target: { value: 'invalid-zone' } });
    save();
    expect(screen.getByRole('alert')).toHaveTextContent('valid time zone');

    fireEvent.change(screen.getByLabelText('Time zone'), { target: { value: 'UTC' } });
    save();
    expect(await screen.findByText(/availability saved/i)).toBeInTheDocument();
  });

  it('shows the server message when the save is refused', async () => {
    render(<AvailabilityPage />);
    await screen.findByLabelText('Time zone');

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Only freelancers set availability.' }),
    });
    save();

    expect(await screen.findByRole('alert')).toHaveTextContent('Only freelancers set availability.');
    expect(screen.queryByText(/availability saved/i)).not.toBeInTheDocument();
  });

  it('says when the saved availability could not be loaded, and still lets them edit', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Unable to load your availability right now.' }),
    });
    render(<AvailabilityPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to load your availability/i);
    expect(screen.getByLabelText('Time zone')).toBeInTheDocument();
  });

  it('loads the new account when the signed-in person changes', async () => {
    const view = render(<AvailabilityPage />);
    await screen.findByLabelText('Time zone');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    account('user-b');
    view.rerender(<AvailabilityPage />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
