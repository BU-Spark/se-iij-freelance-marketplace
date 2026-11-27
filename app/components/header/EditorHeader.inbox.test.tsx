import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorHeader } from './EditorHeader';
import { MOCK_PROFILE } from '../Profile/config/constants';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

const PITCH = {
  id: 'p-1',
  slug: 'shadow-budget',
  status: 'new',
  freelancer: { id: 'f-1', name: 'Maria Lopez' },
  submittedAt: '2026-11-20T10:00:00.000Z',
};

describe('EditorHeader inbox', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => (url.startsWith('/api/pitches') ? { items: [PITCH] } : MOCK_PROFILE),
    }));
  });

  it('counts unread pitches on the inbox button and beside Pitches in the menu', async () => {
    render(<EditorHeader />);

    await userEvent.click(await screen.findByRole('button', { name: 'Open inbox, 1 unread' }));
    expect(screen.getByRole('link', { name: /maria lopez sent you a pitch/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close Inbox' }));
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('link', { name: /pitches\s*1/i })).toBeInTheDocument();
  });
});
