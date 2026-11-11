import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FreelancerWorkspace } from './index';
import { ToastProvider } from '../Toast/ToastProvider';
import { MOCK_PROFILE } from '../Profile/config/constants';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/freelancer',
  useSearchParams: () => new URLSearchParams('panel=profile'),
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));
jest.mock('@clerk/nextjs', () => ({
  useClerk: () => ({ signOut: jest.fn() }),
}));

it('uses the shared header on the freelancer side', async () => {
  // the header reads the signed-in user's roles from /api/profile (mock holds both roles)
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => MOCK_PROFILE });

  render(
    <ToastProvider>
      <FreelancerWorkspace>
        <main>Task content</main>
      </FreelancerWorkspace>
    </ToastProvider>
  );
  expect(screen.getByText('Task content')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /make a pitch/i })).toHaveAttribute(
    'href',
    '/dashboard/freelancer/make-a-pitch'
  );
  expect(screen.getByRole('link', { name: 'Open my profile' })).toHaveAttribute(
    'href',
    '/dashboard/freelancer?panel=profile'
  );
  expect(screen.getByRole('dialog', { name: 'My profile' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  expect(screen.getByRole('link', { name: /available assignments/i })).toBeInTheDocument();
  await userEvent.click(await screen.findByRole('radio', { name: /editor/i }));
  expect(mockPush).toHaveBeenCalledWith('/dashboard');
});
