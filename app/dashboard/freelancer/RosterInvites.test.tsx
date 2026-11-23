import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../components/Toast/ToastProvider';
import type { RosterInvite } from '../../../lib/roster';
import RosterInvites from './RosterInvites';

const invite: RosterInvite = {
  editorId: 'editor-1',
  editorName: 'Jane Doe',
  organizationId: 'The Ledger',
  invitedAt: '2026-11-09T10:00:00.000Z',
  status: 'pending',
};

const originalFetch = global.fetch;
const fetchMock = jest.fn();

const renderInvites = (invites: RosterInvite[] = [invite]) =>
  render(
    <ToastProvider>
      <RosterInvites invites={invites} />
    </ToastProvider>
  );

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: 'accepted' }) });
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('RosterInvites', () => {
  it('stays out of the way when nobody has saved them', () => {
    renderInvites([]);

    expect(screen.queryByRole('heading', { name: /saved by editors/i })).not.toBeInTheDocument();
  });

  it('names the editor, their desk and how many are waiting', () => {
    renderInvites();

    expect(screen.getByRole('heading', { name: /saved by editors 1/i })).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText(/the ledger · saved nov 9, 2026/i)).toBeInTheDocument();
  });

  it('accepts the notification and settles the row', async () => {
    renderInvites();

    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/roster/invites/editor-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: 'accepted' }),
    });
    expect(await screen.findByText("Let Jane Doe know you're interested")).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
  });

  it('declines without leaving the row looking unanswered', async () => {
    renderInvites();

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }));

    expect(fetchMock).toHaveBeenCalledWith('/api/roster/invites/editor-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: 'declined' }),
    });
    expect(await screen.findByText("Told Jane Doe you're not available right now")).toBeInTheDocument();
    expect(screen.getByText('Declined')).toBeInTheDocument();
  });

  it('keeps the notification answerable when the server refuses', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Finish onboarding first.' }) });
    renderInvites();

    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(await screen.findByText('Finish onboarding first.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled();
  });

  it('shows notifications that were already answered', () => {
    renderInvites([{ ...invite, status: 'accepted' }]);

    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
  });
});
