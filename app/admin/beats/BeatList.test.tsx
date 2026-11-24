import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../components/Toast/ToastProvider';
import type { Beat } from '../../types/admin.types';
import BeatList from './BeatList';

const beats: Beat[] = [
  { id: 'b1', name: 'Politics', sortOrder: 0 },
  { id: 'b2', name: 'Housing', sortOrder: 1 },
];

const renderList = () =>
  render(
    <ToastProvider>
      <BeatList beats={beats} />
    </ToastProvider>
  );

const originalFetch = global.fetch;
const fetchMock = jest.fn();

/** Answer the admin API the way the real route does */
const answer = () =>
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (init?.method === 'DELETE') return { ok: true, json: async () => ({ removed: true }) } as unknown as Response;

    if (init?.method === 'PATCH') {
      const { direction } = JSON.parse(String(init?.body)) as { direction: 'up' | 'down' };
      const next = direction === 'up' ? [beats[1], beats[0]] : [beats[0], beats[1]];
      return { ok: true, json: async () => ({ beats: next }) } as unknown as Response;
    }

    const { name } = JSON.parse(String(init?.body)) as { name: string };
    return {
      ok: true,
      status: 201,
      json: async () => ({ beat: { id: `new-${url}`, name, sortOrder: 99 } }),
    } as unknown as Response;
  });

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('BeatList', () => {
  it('lists the beats onboarding offers, in picker order', () => {
    renderList();

    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => within(row).getByRole('heading').textContent)).toEqual(['Politics', 'Housing']);
    expect(screen.getByText(/in the order shown/i)).toBeInTheDocument();
  });

  it('moves a beat with the arrows and keeps the new order', async () => {
    answer();
    renderList();

    // the ends of the list cannot move further out
    expect(screen.getByRole('button', { name: 'Move Politics up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Housing down' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Move Housing up' }));

    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => within(row).getByRole('heading').textContent)).toEqual(['Housing', 'Politics']);
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/beats/b2', expect.objectContaining({ method: 'PATCH' }));
    expect(JSON.parse(String((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).body))).toEqual({ direction: 'up' });
    expect(screen.getByText('Housing moved up.')).toBeInTheDocument();
  });

  it('keeps the order when a move is refused', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Unable to move this beat right now.' }),
    } as unknown as Response);
    renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Move Housing up' }));

    expect(await screen.findByText('Unable to move this beat right now.')).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => within(row).getByRole('heading').textContent)).toEqual(['Politics', 'Housing']);
  });

  it('adds a beat and clears the field', async () => {
    answer();
    renderList();

    await userEvent.type(screen.getByLabelText(/add a beat/i), 'Water rights');
    await userEvent.click(screen.getByRole('button', { name: 'Add beat' }));

    expect(await screen.findByRole('heading', { name: 'Water rights' })).toBeInTheDocument();
    expect(screen.getByLabelText(/add a beat/i)).toHaveValue('');
    expect(screen.getByText('Water rights is now offered during onboarding.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/beats', expect.objectContaining({ method: 'POST' }));
  });

  it('keeps the name and explains why a beat was refused', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'That beat is already on the list.' }),
    } as unknown as Response);
    renderList();

    await userEvent.type(screen.getByLabelText(/add a beat/i), 'politics');
    await userEvent.click(screen.getByRole('button', { name: 'Add beat' }));

    expect(await screen.findByText('That beat is already on the list.')).toBeInTheDocument();
    expect(screen.getByLabelText(/add a beat/i)).toHaveValue('politics');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('removes a beat after the API confirms it', async () => {
    answer();
    renderList();

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Actions for Politics' })).getByRole('button', { name: 'Remove' })
    );

    expect(screen.queryByRole('heading', { name: 'Politics' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Politics is no longer offered. People who already picked it keep it.')
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/beats/b1', { method: 'DELETE' });
  });

  it('keeps the beat when the API refuses the removal', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Unable to remove this beat right now.' }),
    } as unknown as Response);
    renderList();

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Actions for Politics' })).getByRole('button', { name: 'Remove' })
    );

    expect(await screen.findByText('Unable to remove this beat right now.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Politics' })).toBeInTheDocument();
  });

  it('says what to do when no beats are offered', () => {
    render(
      <ToastProvider>
        <BeatList beats={[]} />
      </ToastProvider>
    );

    expect(screen.getByText('No beats yet')).toBeInTheDocument();
  });
});
