import { fireEvent, render, screen, within } from '@testing-library/react';
import { Header } from './Header';

let mockPathname = '/dashboard';
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPathname = '/dashboard';
  mockPush.mockClear();
});

function navigation() {
  return within(screen.getByRole('navigation', { name: 'Main navigation' }));
}

it('shows editor navigation and actions on each editor page', () => {
  const view = render(<Header />);
  for (const path of ['/dashboard', '/dashboard/roster', '/dashboard/pitches']) {
    mockPathname = path;
    view.rerender(<Header />);
    expect(screen.getByRole('button', { name: 'Editor' })).toHaveAttribute('aria-pressed', 'true');
    expect(navigation().getByRole('link', { name: 'Desk' })).toBeInTheDocument();
    expect(navigation().getByRole('link', { name: 'Roster' })).toBeInTheDocument();
    expect(navigation().getByRole('link', { name: /Pitches/ })).toBeInTheDocument();
    expect(navigation().queryByRole('link', { name: 'Assignments' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /New Assignment/ })).toHaveAttribute('href', '/dashboard?new=assignment');
  }
});

it('shows freelancer navigation on direct loads of freelancer pages', () => {
  mockPathname = '/dashboard/availability';
  const view = render(<Header />);
  for (const path of ['/dashboard/availability', '/dashboard/assignments', '/dashboard/profile']) {
    mockPathname = path;
    view.rerender(<Header />);
    expect(screen.getByRole('button', { name: 'Freelancer' })).toHaveAttribute('aria-pressed', 'true');
    expect(navigation().getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(navigation().getByRole('link', { name: 'My availability' })).toBeInTheDocument();
    expect(navigation().getByRole('link', { name: 'My profile' })).toBeInTheDocument();
    expect(navigation().queryByRole('link', { name: 'Roster' })).not.toBeInTheDocument();
    expect(navigation().queryByRole('link', { name: /Pitches/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /New Assignment/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Make a Pitch/ })).toHaveAttribute(
      'href',
      '/dashboard/freelancer/make-a-pitch'
    );
  }
});

it('navigates on switching roles and follows route changes in either direction', () => {
  const view = render(<Header />);
  fireEvent.click(screen.getByRole('button', { name: 'Freelancer' }));
  expect(mockPush).toHaveBeenLastCalledWith('/dashboard/freelancer');
  mockPathname = '/dashboard/freelancer';
  view.rerender(<Header />);
  expect(navigation().getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  fireEvent.click(screen.getByRole('button', { name: 'Freelancer' }));
  expect(mockPush).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
  expect(mockPush).toHaveBeenLastCalledWith('/dashboard');
  mockPathname = '/dashboard';
  view.rerender(<Header />);
  expect(navigation().getByRole('link', { name: 'Desk' })).toHaveAttribute('aria-current', 'page');
});
