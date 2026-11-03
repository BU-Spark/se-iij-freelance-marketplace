import { fireEvent, render, screen } from '@testing-library/react';
import { useAuth } from '@clerk/nextjs';
import AvailabilityPage from './page';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));
jest.mock('../../components/header/Header', () => ({ Header: () => <header>Header</header> }));
const auth = jest.mocked(useAuth);
const account = (userId: string) => auth.mockReturnValue({ userId, isLoaded: true } as ReturnType<typeof useAuth>);
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save availability' }));

beforeEach(() => {
  localStorage.clear();
  account('user-a');
});

afterEach(() => jest.restoreAllMocks());

it('saves explicit changes and restores them after remount', () => {
  const view = render(<AvailabilityPage />);
  fireEvent.change(screen.getByLabelText('Current status'), { target: { value: 'busy' } });
  fireEvent.change(screen.getByLabelText('Time zone'), { target: { value: 'Europe/London' } });
  fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '10:00' } });
  fireEvent.click(screen.getByLabelText('Saturday'));
  expect(localStorage.getItem('iij:availability:user-a')).toBeNull();
  save();
  expect(screen.getByRole('status')).toHaveTextContent('saved on this browser');
  view.unmount();
  render(<AvailabilityPage />);
  expect(screen.getByLabelText('Current status')).toHaveValue('busy');
  expect(screen.getByLabelText('Time zone')).toHaveValue('Europe/London');
  expect(screen.getByLabelText('Start time')).toHaveValue('10:00');
  expect(screen.getByLabelText('Saturday')).toBeChecked();
});

it('rejects reversed times, missing working days, and invalid time zones', () => {
  render(<AvailabilityPage />);
  fireEvent.change(screen.getByLabelText('End time'), { target: { value: '08:00' } });
  save();
  expect(screen.getByRole('alert')).toHaveTextContent('End time must be later');
  fireEvent.change(screen.getByLabelText('End time'), { target: { value: '17:00' } });
  for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
    fireEvent.click(screen.getByLabelText(day));
  }
  save();
  expect(screen.getByRole('alert')).toHaveTextContent('Choose at least one working day');
  fireEvent.change(screen.getByLabelText('Current status'), { target: { value: 'off' } });
  fireEvent.change(screen.getByLabelText('Time zone'), { target: { value: 'invalid-zone' } });
  save();
  expect(screen.getByRole('alert')).toHaveTextContent('valid time zone');
  fireEvent.change(screen.getByLabelText('Time zone'), { target: { value: 'UTC' } });
  save();
  expect(screen.getByRole('status')).toHaveTextContent('saved on this browser');
});

it('keeps saved settings separate when accounts change', () => {
  const view = render(<AvailabilityPage />);
  fireEvent.change(screen.getByLabelText('Current status'), { target: { value: 'off' } });
  save();
  account('user-b');
  view.rerender(<AvailabilityPage />);
  expect(screen.getByLabelText('Current status')).toHaveValue('available');
  expect(localStorage.getItem('iij:availability:user-b')).toBeNull();
});

it('handles malformed saved data and storage write failure', () => {
  localStorage.setItem('iij:availability:user-a', '{broken');
  render(<AvailabilityPage />);
  expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage blocked');
  });
  save();
  expect(screen.getByRole('alert')).toHaveTextContent('have not been saved');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
