import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AvailabilityForm from './AvailabilityForm';

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

/** Today, keyed the way the calendar keys it, so the day buttons can be found */
const TODAY = (() => {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  return {
    date,
    label: new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`)),
    weekday: now.getDay() >= 1 && now.getDay() <= 5,
  };
})();

const dayButton = (label: string) => screen.getByRole('button', { name: (name) => name.startsWith(label) });

const save = () => fireEvent.click(screen.getByRole('button', { name: /save availability/i }));

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(ok(EMPTY));
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('AvailabilityForm', () => {
  it('starts from what was saved for this account', async () => {
    fetchMock.mockResolvedValue(ok(SAVED));
    render(<AvailabilityForm userId="user-a" />);

    expect(await screen.findByLabelText('Time zone')).toHaveValue('Europe/London');
    expect(screen.getByLabelText(/free right now/i)).toBeChecked();
    expect(screen.getByLabelText('Start time')).toHaveValue('10:00');
    expect(screen.getByLabelText('End time')).toHaveValue('18:00');
    expect(screen.getByLabelText('Saturday')).toBeChecked();
    expect(fetchMock).toHaveBeenCalledWith('/api/profile/availability', { cache: 'no-store' });
  });

  it('saves the switch and the hours to the account', async () => {
    render(<AvailabilityForm userId="user-a" />);
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
        exceptions: [],
      }),
    });
  });

  it('marks a single date the other way round from the usual week', async () => {
    render(<AvailabilityForm userId="user-a" />);
    await screen.findByLabelText('Time zone');

    fireEvent.click(dayButton(TODAY.label));
    expect(screen.getByText('1 date differs from your usual week.')).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(ok({ saved: true }));
    save();
    await screen.findByText(/availability saved/i);

    const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({
      days: WEEKDAYS,
      exceptions: [{ date: TODAY.date, available: !TODAY.weekday }],
    });
  });

  it('puts a date back on the usual week when it is clicked through', async () => {
    render(<AvailabilityForm userId="user-a" />);
    await screen.findByLabelText('Time zone');

    // a working day goes off, then on, then back; a weekend day only goes on, then back
    for (let click = 0; click < (TODAY.weekday ? 3 : 2); click += 1) {
      fireEvent.click(dayButton(TODAY.label));
    }

    expect(screen.getByText('Every date follows your usual week.')).toBeInTheDocument();
  });

  it('rejects reversed times, a dayless week, and an invalid time zone', async () => {
    render(<AvailabilityForm userId="user-a" />);
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
    render(<AvailabilityForm userId="user-a" />);
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
    render(<AvailabilityForm userId="user-a" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/unable to load your availability/i);
    expect(screen.getByLabelText('Time zone')).toBeInTheDocument();
  });

  it('loads the new account when the signed-in person changes', async () => {
    const view = render(<AvailabilityForm key="user-a" userId="user-a" />);
    await screen.findByLabelText('Time zone');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    view.rerender(<AvailabilityForm key="user-b" userId="user-b" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
