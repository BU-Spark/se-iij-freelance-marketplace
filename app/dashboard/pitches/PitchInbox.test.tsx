import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PitchInbox from './PitchInbox';
import { PITCHES } from '../../../test/fixtures/pitches';

const newCount = PITCHES.filter((p) => p.status === 'new').length;
const cardFor = (slug: string) => screen.queryByRole('button', { name: new RegExp(slug) });
const tab = (name: string) =>
  within(screen.getByRole('group', { name: /filter pitches/i })).getByRole('button', { name });

const fetchMock = jest.fn();

const respondWith = (body: unknown, ok = true, status = 200) =>
  fetchMock.mockResolvedValue({ ok, status, json: async () => body });

describe('PitchInbox', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    respondWith({ id: PITCHES[0].id, status: 'accepted' });
    global.fetch = fetchMock as unknown as typeof fetch;
    render(<PitchInbox pitches={PITCHES} />);
  });

  it('lists every pitch with the counts', () => {
    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByText(`${PITCHES.length} pitches`)).toBeInTheDocument();
    expect(screen.getByText(`${newCount} new`)).toBeInTheDocument();
    PITCHES.forEach((p) => expect(cardFor(p.slug)).toBeInTheDocument());
  });

  it('opens the first pitch by default', () => {
    expect(cardFor(PITCHES[0].slug)).toHaveAttribute('aria-pressed', 'true');
    const detail = screen.getByRole('region', { name: /pitch details/i });
    expect(within(detail).getByText(PITCHES[0].slug)).toBeInTheDocument();
  });

  it('opens a pitch when it is clicked', () => {
    const second = PITCHES[1];
    fireEvent.click(cardFor(second.slug)!);
    expect(cardFor(second.slug)).toHaveAttribute('aria-pressed', 'true');
    const detail = screen.getByRole('region', { name: /pitch details/i });
    expect(within(detail).getByText(second.slug)).toBeInTheDocument();
  });

  it('saves accepted feedback and moves the pitch to the status the API reports', async () => {
    fireEvent.change(screen.getByLabelText('Decision'), { target: { value: 'accepted' } });
    fireEvent.change(screen.getByLabelText('Comments'), { target: { value: 'Strong proposal.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));

    await waitFor(() => expect(within(cardFor(PITCHES[0].slug)!).getByText('Accepted')).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/pitches/${PITCHES[0].id}`,
      expect.objectContaining({ method: 'PATCH' })
    );
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({
      feedback: { decision: 'accepted', comments: 'Strong proposal.', strengths: '', improvements: '' },
    });
    expect(screen.getByText(`${newCount - 1} new`)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Latest pitch feedback' })).toHaveTextContent('Strong proposal.');
  });

  it('leaves the pitch untouched and says so when the save fails', async () => {
    respondWith({ error: 'nope' }, false, 500);

    fireEvent.change(screen.getByLabelText('Comments'), { target: { value: 'Nice.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i);
    expect(within(cardFor(PITCHES[0].slug)!).getByText('New')).toBeInTheDocument();
    expect(screen.getByText(`${newCount} new`)).toBeInTheDocument();
  });

  it('shows only the pitches for the chosen tab', () => {
    fireEvent.click(tab('Declined'));
    expect(tab('Declined')).toHaveAttribute('aria-pressed', 'true');
    PITCHES.forEach((p) => {
      if (p.status === 'declined') expect(cardFor(p.slug)).toBeInTheDocument();
      else expect(cardFor(p.slug)).not.toBeInTheDocument();
    });
  });

  it('says so when a tab has no pitches', () => {
    fireEvent.click(tab('Negotiating'));
    expect(screen.getByText('No negotiating pitches.')).toBeInTheDocument();
  });
});
