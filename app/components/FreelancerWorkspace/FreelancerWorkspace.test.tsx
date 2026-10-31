import { fireEvent, render, screen } from '@testing-library/react';
import { FreelancerWorkspace } from './index';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/freelancer',
  useRouter: () => ({ push: mockPush }),
}));

it('toggles the menu, links personal tasks and profile, and switches workspace', () => {
  render(
    <FreelancerWorkspace>
      <main>Task content</main>
    </FreelancerWorkspace>
  );
  const toggle = screen.getByRole('button', { name: 'Toggle freelancer menu' });
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('link', { name: 'My assignments' })).toHaveAttribute(
    'href',
    '/dashboard/freelancer#active-assignments'
  );
  expect(screen.getByRole('link', { name: /My profile/ })).toHaveAttribute('href', '/dashboard/profile');
  expect(screen.getByRole('link', { name: /Make a pitch/ })).toHaveAttribute(
    'href',
    '/dashboard/freelancer/make-a-pitch'
  );
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('navigation', { name: 'Freelancer menu' })).not.toBeInTheDocument();
  expect(screen.getByText('Task content')).toBeInTheDocument();
  fireEvent.click(toggle);
  expect(screen.getByRole('navigation', { name: 'Freelancer menu' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Workspace role'), { target: { value: 'editor' } });
  expect(mockPush).toHaveBeenCalledWith('/dashboard');
});

it('opens the envelope notification panel and derives unread count from data', () => {
  render(
    <FreelancerWorkspace notifications={[{ id: '1', message: 'A new invitation', unread: true }]}>
      <main>Tasks</main>
    </FreelancerWorkspace>
  );
  fireEvent.click(screen.getByLabelText('Notifications, 1 unread'));
  expect(screen.getByRole('region', { name: 'Notifications' })).toBeVisible();
  expect(screen.getByText('A new invitation')).toBeVisible();
});
