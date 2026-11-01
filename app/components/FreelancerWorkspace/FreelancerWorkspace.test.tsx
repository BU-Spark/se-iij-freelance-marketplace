import { fireEvent, render, screen } from '@testing-library/react';
import { FreelancerWorkspace } from './index';
import { ToastProvider } from '../Toast/ToastProvider';
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/freelancer',
  useSearchParams: () => new URLSearchParams('panel=profile'),
  useRouter: () => ({ push: mockPush }),
}));
it('uses the team profile panel and toggles the freelancer menu', () => {
  render(
    <ToastProvider>
      <FreelancerWorkspace>
        <main>Task content</main>
      </FreelancerWorkspace>
    </ToastProvider>
  );
  expect(screen.getByRole('link', { name: 'Open my profile' })).toHaveAttribute(
    'href',
    '/dashboard/freelancer?panel=profile'
  );
  expect(screen.getByRole('dialog', { name: 'My profile' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'My assignments' })).toHaveAttribute(
    'href',
    '/dashboard/freelancer#active-assignments'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Toggle freelancer menu' }));
  expect(screen.queryByRole('navigation', { name: 'Freelancer menu' })).not.toBeInTheDocument();
  expect(screen.getByText('Task content')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Toggle freelancer menu' }));
  expect(screen.getByRole('link', { name: 'Make a pitch' })).toHaveAttribute(
    'href',
    '/dashboard/freelancer/make-a-pitch'
  );
  fireEvent.change(screen.getByLabelText('Workspace role'), { target: { value: 'editor' } });
  expect(mockPush).toHaveBeenCalledWith('/dashboard');
});
it('opens notifications and derives the unread indicator from data', () => {
  render(
    <ToastProvider>
      <FreelancerWorkspace notifications={[{ id: '1', message: 'New invitation', unread: true }]}>
        <main>Tasks</main>
      </FreelancerWorkspace>
    </ToastProvider>
  );
  fireEvent.click(screen.getByLabelText('Notifications, 1 unread'));
  expect(screen.getByRole('region', { name: 'Notifications' })).toBeVisible();
});
