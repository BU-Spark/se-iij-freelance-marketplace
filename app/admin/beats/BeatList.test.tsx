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
    expect(screen.getByText(/removing a beat only stops it being offered/i)).toBeInTheDocument();
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
