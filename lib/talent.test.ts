/**
 * @jest-environment node
 */
import { db } from './db';
import { buildTalentQuery, listTalentFilterOptions, searchTalent, toClips } from './talent';
import { TALENT_PAGE_SIZE } from '../app/utils/talent.utils';

jest.mock('./db', () => ({ db: { query: jest.fn() } }));

const queryMock = db.query as jest.Mock;

describe('buildTalentQuery', () => {
  it('with no filters, lists every freelancer, people free right now first, capped', () => {
    const { sql, params } = buildTalentQuery({});

    expect(sql).toContain("'freelancer' = ANY(u.roles)");
    expect(sql).not.toContain('ILIKE');
    expect(sql).toMatch(/ORDER BY u\.available_now DESC/);
    expect(params).toEqual([TALENT_PAGE_SIZE]);
  });

  it('binds search text as a parameter and escapes LIKE wildcards', () => {
    const { sql, params } = buildTalentQuery({ q: "  50%_o'brien  " });

    expect(sql).toContain('ILIKE $1');
    expect(sql).not.toContain("o'brien");
    expect(params[0]).toBe("%50\\%\\_o'brien%");
  });

  it('adds one bound condition per filter, numbered in order', () => {
    const { sql, params } = buildTalentQuery({
      q: 'housing',
      beat: 'Politics',
      medium: 'Audio',
      location: 'Leeds, UK',
      availableNow: true,
    });

    expect(sql).toContain('$2 = ANY(f.beats) OR $2 = ANY(f.beat_tags)');
    expect(sql).toContain('$3 = ANY(f.work_mediums)');
    expect(sql).toContain('f.location = $4');
    expect(sql).toContain('u.available_now = true');
    expect(sql).toContain('LIMIT $5');
    expect(params).toEqual(['%housing%', 'Politics', 'Audio', 'Leeds, UK', TALENT_PAGE_SIZE]);
  });

  it('ignores blank search text', () => {
    expect(buildTalentQuery({ q: '   ' }).params).toEqual([TALENT_PAGE_SIZE]);
  });
});

describe('searchTalent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps rows onto cards with their mediums and free-now flag', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 'user-1',
          first_name: 'Sarah',
          last_name: 'Jenkins',
          available_now: true,
          location: 'Leeds, UK',
          beats: ['Politics'],
          beat_tags: [],
          work_mediums: ['Text', 'Audio'],
          availability: null,
        },
      ],
    });

    const [member] = await searchTalent({ q: 'sarah' });

    expect(member).toMatchObject({
      id: 'user-1',
      name: 'Sarah Jenkins',
      specialty: 'Politics',
      mediums: ['Text', 'Audio'],
      availableNow: true,
      // free right now, even though they have no weekly pattern
      status: 'available',
      note: 'Free right now',
    });
    expect(queryMock.mock.calls[0][1]).toEqual(['%sarah%', TALENT_PAGE_SIZE]);
  });

  it('passes database errors up so the page can show its failed state', async () => {
    queryMock.mockRejectedValue(new Error('db down'));
    await expect(searchTalent({})).rejects.toThrow('db down');
  });
});

describe('listTalentFilterOptions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the dropdown values, or empty lists when there are none', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ beats: ['Politics'], mediums: ['Audio'], locations: ['Leeds, UK'] }] });
    await expect(listTalentFilterOptions()).resolves.toEqual({
      beats: ['Politics'],
      mediums: ['Audio'],
      locations: ['Leeds, UK'],
    });

    queryMock.mockResolvedValueOnce({ rows: [{ beats: null, mediums: null, locations: null }] });
    await expect(listTalentFilterOptions()).resolves.toEqual({ beats: [], mediums: [], locations: [] });
  });
});

describe('toClips', () => {
  it('keeps titled http(s) clips and drops unsafe or malformed ones', () => {
    expect(
      toClips([
        { title: 'Budget explainer', url: 'https://example.com/a', type: 'article', description: ' Lead story ' },
        { title: 'No title falls back to the link', url: 'http://example.com/b' },
        { title: 'Script', url: 'javascript:alert(1)' },
        { title: 'Not a link', url: 'example.com' },
        null,
        'nonsense',
      ])
    ).toEqual([
      { title: 'Budget explainer', url: 'https://example.com/a', type: 'article', description: 'Lead story' },
      {
        title: 'No title falls back to the link',
        url: 'http://example.com/b',
        type: undefined,
        description: undefined,
      },
    ]);
    expect(toClips(null)).toEqual([]);
    expect(toClips({})).toEqual([]);
  });
});
