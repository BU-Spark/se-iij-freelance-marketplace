import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvailableNowToggle from './AvailableNowToggle';

const SAVED = {
  role: 'freelancer',
  availableNow: false,
  timezone: 'America/New_York',
  days: ['mon', 'tue'],
  startsAt: '09:00',
  endsAt: '17:00',
  exceptions: [],
};

const reply = (body: unknown, ok = true) => Promise.resolve({ ok, json: async () => body } as Response);

afterEach(() => jest.restoreAllMocks());

it('flips the switch and saves the rest of the card unchanged', async () => {
  const fetchMock = jest.fn().mockReturnValueOnce(reply(SAVED)).mockReturnValueOnce(reply({}));
  global.fetch = fetchMock;
  render(<AvailableNowToggle />);

  const toggle = await screen.findByRole('switch', { name: 'Away' });
  await userEvent.click(toggle);

  await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
  expect(screen.getByRole('switch')).toHaveTextContent('Available now');
  const [url, init] = fetchMock.mock.calls[1];
  expect(url).toBe('/api/profile/availability');
  expect(JSON.parse(init.body)).toEqual({ ...SAVED, availableNow: true });
});

it('keeps the old state and says so when saving fails', async () => {
  global.fetch = jest.fn().mockReturnValueOnce(reply(SAVED)).mockReturnValueOnce(reply({}, false));
  render(<AvailableNowToggle />);

  await userEvent.click(await screen.findByRole('switch'));

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not update/i);
  expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
});

it('points to settings when working hours were never set', async () => {
  global.fetch = jest.fn().mockReturnValueOnce(reply({ ...SAVED, timezone: null, startsAt: null }));
  render(<AvailableNowToggle />);

  expect(await screen.findByRole('link', { name: 'Set availability' })).toHaveAttribute('href', '/dashboard/settings');
});

it('shows nothing when availability cannot be loaded', async () => {
  global.fetch = jest.fn().mockReturnValueOnce(reply({}, false));
  const { container } = render(<AvailableNowToggle />);

  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  expect(container).toBeEmptyDOMElement();
});
