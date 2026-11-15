/**
 * @jest-environment node
 */
import { db } from './db';
import { listOrganizationTeam } from './organization';

jest.mock('./db', () => ({ db: { query: jest.fn() } }));

const queryMock = db.query as jest.Mock;

describe('listOrganizationTeam', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('turns editor rows into the people on the organization', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 'user-1',
          first_name: 'Joey',
          last_name: 'Lam',
          job_title: 'News editor',
          location: 'Boston',
          desks: ['Politics', 'Climate'],
        },
        { id: 'user-2', first_name: 'Sam', last_name: '', job_title: 'Desk editor', location: null, desks: null },
      ],
    });

    const team = await listOrganizationTeam('meridian');

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('e.organization_id = $1'), ['meridian']);
    expect(team).toEqual([
      { id: 'user-1', name: 'Joey Lam', jobTitle: 'News editor', location: 'Boston', desks: ['Politics', 'Climate'] },
      { id: 'user-2', name: 'Sam', jobTitle: 'Desk editor', location: null, desks: [] },
    ]);
  });

  it('gives a nameless row something to show', async () => {
    queryMock.mockResolvedValue({
      rows: [{ id: 'user-3', first_name: '', last_name: '', job_title: 'Editor', location: null, desks: [] }],
    });

    expect((await listOrganizationTeam('signal'))[0].name).toBe('Unnamed editor');
  });
});
