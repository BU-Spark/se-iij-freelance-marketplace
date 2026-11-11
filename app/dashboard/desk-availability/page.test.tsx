import { render, screen } from '@testing-library/react';
import { useAuth } from '@clerk/nextjs';
import DeskAvailabilityPage from './page';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));

const auth = jest.mocked(useAuth);
const originalFetch = global.fetch;

beforeEach(() => {
  auth.mockReturnValue({ userId: 'user-a', isLoaded: true } as ReturnType<typeof useAuth>);
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      role: 'editor',
      availableNow: false,
      timezone: 'UTC',
      days: [],
      startsAt: '09:00',
      endsAt: '17:00',
    }),
  }) as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('Desk availability page', () => {
  it('offers the same form, worded for the editor side of the desk', async () => {
    render(<DeskAvailabilityPage />);

    expect(screen.getByRole('heading', { level: 1, name: /my availability/i })).toBeInTheDocument();
    expect(screen.getByText(/freelancers use this to time their pitches/i)).toBeInTheDocument();
    expect(await screen.findByLabelText('Time zone')).toBeInTheDocument();
    expect(screen.getByLabelText(/free right now/i)).toBeInTheDocument();
  });
});
