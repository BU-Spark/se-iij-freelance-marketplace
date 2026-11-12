import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PitchInbox from './PitchInbox';
import { PITCHES } from '../../../test/fixtures/pitches';

const newCount = PITCHES.filter((p) => p.status === 'new').length;
/** Declined pitches belong to the archive, so they never reach the inbox */
const onDesk = PITCHES.filter((p) => p.status !== 'declined');
const onDeskCount = onDesk.length;
const cardFor = (slug: string) => screen.queryByRole('button', { name: new RegExp(slug) });
const tab = (name: string) =>
  within(screen.getByRole('group', { name: /filter pitches/i })).getByRole('button', { name });
const action = (name: RegExp) =>
  within(screen.getByRole('group', { name: 'Pitch decision' })).getByRole('button', { name });

const fetchMock = jest.fn();

type SentBody = { status?: string; feedback?: { decision: string } };

/** The status each decision lands on, mirroring `STATUS_FOR_DECISION` */
const STATUS_FOR_DECISION: Record<string, string> = {
  accepted: 'accepted',
  rejected: 'declined',
  revision_requested: 'negotiating',
};

/** Answers like the API does: feedback carries its own status, a plain status keeps itself */
const respond = (init?: RequestInit) => {
  const body = JSON.parse((init?.body as string) ?? '{}') as SentBody;
  const status = body.status ?? STATUS_FOR_DECISION[body.feedback!.decision];
  return { ok: true, status: 200, json: async () => ({ status }) };
};

/** Every request sent for one pitch, so a background "reviewed" call never muddies an assertion */
const callsFor = (id: string) => fetchMock.mock.calls.filter(([url]) => url === `/api/pitches/${id}`);
const lastBodyFor = (id: string) => {
  const calls = callsFor(id);
  return JSON.parse((calls[calls.length - 1][1] as RequestInit).body as string);
};

describe('PitchInbox', () => {
  beforeEach(async () => {
    fetchMock.mockReset();
    fetchMock.mockImplementation((_url: string, init?: RequestInit) => Promise.resolve(respond(init)));
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<PitchInbox pitches={PITCHES} />);
    // the pitch opened on mount is marked reviewed; let that request settle before each test
    await waitFor(() => expect(within(cardFor(PITCHES[0].slug)!).getByText('Reviewed')).toBeInTheDocument());
  });

  it('lists every pitch on the desk and counts down the unread ones as they are opened', async () => {
    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByText(`${onDeskCount} pitches`)).toBeInTheDocument();
    onDesk.forEach((p) => expect(cardFor(p.slug)).toBeInTheDocument());
    // the pitch on screen has been read, so one fewer is new
    expect(await screen.findByText(`${newCount - 1} new`)).toBeInTheDocument();
  });

  it('leaves declined pitches out of the inbox and points at the archive', () => {
    PITCHES.filter((p) => p.status === 'declined').forEach((p) => expect(cardFor(p.slug)).not.toBeInTheDocument());
    expect(screen.getByRole('link', { name: /archive/i })).toHaveAttribute('href', '/dashboard/pitches/archive');
    expect(tab('Accepted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Declined' })).not.toBeInTheDocument();
  });

  it('opens the first pitch by default', () => {
    expect(cardFor(PITCHES[0].slug)).toHaveAttribute('aria-pressed', 'true');
    const detail = screen.getByRole('region', { name: /pitch details/i });
    expect(within(detail).getByText(PITCHES[0].slug)).toBeInTheDocument();
  });

  it('marks an opened pitch reviewed when no action is taken', async () => {
    const first = PITCHES[0];
    await waitFor(() => expect(lastBodyFor(first.id)).toEqual({ status: 'reviewed' }));
    expect(within(cardFor(first.slug)!).getByText('Reviewed')).toBeInTheDocument();
  });

  it('marks a pitch reviewed when it is clicked, without deciding it', async () => {
    const second = PITCHES[1];
    fireEvent.click(cardFor(second.slug)!);
    expect(cardFor(second.slug)).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(lastBodyFor(second.id)).toEqual({ status: 'reviewed' }));
    await waitFor(() => expect(within(cardFor(second.slug)!).getByText('Reviewed')).toBeInTheDocument());
  });

  it('accepts a pitch through the two-step review', async () => {
    fireEvent.click(action(/^Accept/));
    fireEvent.change(screen.getByLabelText('Comments'), { target: { value: 'Strong proposal.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));

    await waitFor(() => expect(within(cardFor(PITCHES[0].slug)!).getByText('Accepted')).toBeInTheDocument());

    expect(lastBodyFor(PITCHES[0].id)).toEqual({
      feedback: { decision: 'accepted', comments: 'Strong proposal.', strengths: '', improvements: '' },
    });
    expect(screen.getByRole('region', { name: 'Latest pitch feedback' })).toHaveTextContent('Strong proposal.');
  });

  it('declines a pitch through the two-step review and moves it to the archive', async () => {
    fireEvent.click(action(/^Decline/));
    fireEvent.change(screen.getByLabelText('Comments'), { target: { value: 'Not for this desk.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));

    await waitFor(() => expect(cardFor(PITCHES[0].slug)).not.toBeInTheDocument());
    expect(lastBodyFor(PITCHES[0].id)).toEqual({
      feedback: { decision: 'rejected', comments: 'Not for this desk.', strengths: '', improvements: '' },
    });
    expect(screen.getByText(`${onDeskCount - 1} pitches`)).toBeInTheDocument();
    // the pitch stays open so the desk can see where it went
    expect(screen.getByText(/This pitch is in the/)).toHaveTextContent('archive');
  });

  it('leaves the pitch untouched and says so when the save fails', async () => {
    // wait for the background "reviewed" call before breaking the network
    await waitFor(() => expect(within(cardFor(PITCHES[0].slug)!).getByText('Reviewed')).toBeInTheDocument());
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'nope' }) });

    fireEvent.click(action(/^Accept/));
    fireEvent.change(screen.getByLabelText('Comments'), { target: { value: 'Nice.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i);
    expect(within(cardFor(PITCHES[0].slug)!).getByText('Reviewed')).toBeInTheDocument();
  });

  it('shows only the pitches for the chosen tab', () => {
    fireEvent.click(tab('Accepted'));
    expect(tab('Accepted')).toHaveAttribute('aria-pressed', 'true');
    onDesk.forEach((p) => {
      if (p.status === 'accepted') expect(cardFor(p.slug)).toBeInTheDocument();
      else expect(cardFor(p.slug)).not.toBeInTheDocument();
    });
  });

  it('says so when a tab has no pitches', () => {
    fireEvent.click(tab('Negotiating'));
    expect(screen.getByText('No negotiating pitches.')).toBeInTheDocument();
  });

  it('says so when a tab has no pitches', () => {
    fireEvent.click(tab('Negotiating'));
    expect(screen.getByText('No negotiating pitches.')).toBeInTheDocument();
  });
});
