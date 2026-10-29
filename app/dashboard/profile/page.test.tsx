import { fireEvent, render, screen, within } from '@testing-library/react';
import { useAuth } from '@clerk/nextjs';
import ProfilePage from './page';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));
jest.mock('../../components/header/Header', () => ({ Header: () => <header>Header</header> }));
const auth = jest.mocked(useAuth);
const account = (userId: string) => auth.mockReturnValue({ userId, isLoaded: true } as ReturnType<typeof useAuth>);
const edit = () => fireEvent.click(screen.getByRole('button', { name: /Add profile details|^Edit profile$/ }));
const change = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(typeof label === 'string' ? new RegExp(`^${label}`, 'i') : label), {
    target: { value },
  });
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
const fill = () => {
  change('First name', 'Alex');
  change('Last name', 'Rivera');
  change('Email', 'alex@example.com');
  change('Based in', 'Boston');
  fireEvent.click(screen.getByRole('button', { name: /^[+✓]\s*Climate$/ }));
  fireEvent.click(screen.getByRole('button', { name: /^[+✓]\s*Text$/ }));
  change('Portfolio link', 'https://example.com/portfolio');
};

beforeEach(() => {
  localStorage.clear();
  account('user-a');
});
afterEach(() => jest.restoreAllMocks());

it('validates before saving, displays details, and restores after remount', () => {
  const view = render(<ProfilePage />);
  edit();
  save();
  expect(screen.getByText('Please enter your first name')).toBeInTheDocument();
  expect(localStorage.getItem('iij:profile:user-a')).toBeNull();
  fill();
  save();
  const details = within(screen.getByRole('region', { name: 'Your profile' }));
  expect(details.getByText('alex@example.com')).toBeInTheDocument();
  expect(details.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', 'https://example.com/portfolio');
  view.unmount();
  render(<ProfilePage />);
  expect(screen.getByRole('heading', { name: 'Alex Rivera' })).toBeInTheDocument();
});

it('prefills edits and cancels without changing saved details', () => {
  render(<ProfilePage />);
  edit();
  fill();
  save();
  edit();
  expect(screen.getByLabelText('First name')).toHaveValue('Alex');
  change('First name', 'Changed');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByRole('heading', { name: 'Alex Rivera' })).toBeInTheDocument();
  edit();
  expect(screen.getByLabelText('First name')).toHaveValue('Alex');
  change('First name', 'Updated');
  save();
  expect(screen.getByRole('heading', { name: 'Updated Rivera' })).toBeInTheDocument();
});

it('separates profiles when the signed-in account changes', () => {
  const view = render(<ProfilePage />);
  edit();
  fill();
  save();
  account('user-b');
  view.rerender(<ProfilePage />);
  expect(screen.getByText(/No profile is saved/)).toBeInTheDocument();
  expect(screen.queryByText('alex@example.com')).not.toBeInTheDocument();
});

it('handles corrupt saved data and reports storage failure without claiming success', () => {
  localStorage.setItem('iij:profile:user-a', JSON.stringify({ firstName: 'Broken' }));
  render(<ProfilePage />);
  expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');
  edit();
  fill();
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage blocked');
  });
  save();
  expect(screen.getByRole('alert')).toHaveTextContent('have not been saved');
  expect(screen.getByLabelText('First name')).toHaveValue('Alex');
});
