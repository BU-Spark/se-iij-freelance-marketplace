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
    // people whose timer has run out sort as not free, even though their flag is still set
    expect(sql).toMatch(
      /ORDER BY \(u\.available_now AND \(u\.available_until IS NULL OR u\.available_until > NOW\(\)\)\) DESC/
    );
    expect(params).toEqual([TALENT_PAGE_SIZE]);
  });

  it('binds search text as a parameter and escapes LIKE wildcards', () => {
    const { sql, params } = buildTalentQuery({ q: "  50%_o'brien  " });

    expect(sql).toContain('ILIKE $1');
    expect(sql).not.toContain("o'brien");
    expect(params[0]).toBe("%50\\%\\_o'brien%");
    // the words themselves are what the ranking scores
    expect(params[1]).toEqual(["50%_o'brien"]);
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
    expect(sql).toContain('u.available_now = true AND (u.available_until IS NULL OR u.available_until > NOW())');
    expect(sql).toContain('unnest($5::text[])');
    expect(sql).toContain('LIMIT $6');
    expect(params).toEqual(['%housing%', 'Politics', 'Audio', 'Leeds, UK', ['housing'], TALENT_PAGE_SIZE]);
  });

  it('scores each search word and ranks the best matches first', () => {
    const { sql } = buildTalentQuery({ q: 'climate policy' });

    expect(sql).toContain('LEFT JOIN LATERAL (SELECT COALESCE(SUM(');
    // the score leads, and free right now then the name still settle ties
    expect(sql).toContain('ORDER BY (COALESCE(relevance.text_score, 0)) DESC');
    expect(sql).toMatch(/\) DESC,\s*\(u\.available_now/);
    // a beat counts for more than a bio, and a word that starts a value counts extra
    expect(sql).toContain('THEN 6 ELSE 0 END');
    expect(sql).toContain('THEN 2 ELSE 0 END');
  });

  it('puts a headline beat ahead of a beat that is only tagged', () => {
    const { sql, params } = buildTalentQuery({ beat: 'Politics' });

    expect(params).toEqual(['Politics', TALENT_PAGE_SIZE]);
    expect(sql).toContain('ORDER BY (CASE WHEN $1 = ANY(f.beats) THEN 6');
    expect(sql).toContain('WHEN $1 = ANY(f.beat_tags) THEN 3');
    // no search text, so nothing to score word by word
    expect(sql).not.toContain('LATERAL');
  });

  it('ignores blank search text', () => {
    expect(buildTalentQuery({ q: '   ' }).params).toEqual([TALENT_PAGE_SIZE]);
  });

  it('scores the raw words, so wildcard characters stay literal', () => {
    const { sql, params } = buildTalentQuery({ q: '100%_harbor' });

    expect(sql).toContain('unnest($2::text[])');
    expect(params[0]).toBe('%100\\%\\_harbor%');
    expect(params[1]).toEqual(['100%_harbor']);
  });

  it('combines the search score with the beat-filter score', () => {
    const { sql, params } = buildTalentQuery({ q: 'harbor', beat: 'Politics' });

    expect(sql).toMatch(/ORDER BY \(COALESCE\(relevance\.text_score, 0\) \+ CASE WHEN \$2 = ANY\(f\.beats\) THEN 6/);
    expect(params).toEqual(['%harbor%', 'Politics', ['harbor'], TALENT_PAGE_SIZE]);
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
    expect(queryMock.mock.calls[0][1]).toEqual(['%sarah%', ['sarah'], TALENT_PAGE_SIZE]);
  });

  it('passes database errors up so the page can show its failed state', async () => {
    queryMock.mockRejectedValue(new Error('db down'));
    await expect(searchTalent({})).rejects.toThrow('db down');
  });

  it('stops calling someone free once their timer has run out', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 'user-1',
          first_name: 'Sarah',
          last_name: 'Jenkins',
          available_now: true,
          available_until: '2020-01-01T09:00:00.000Z',
          location: 'Leeds, UK',
          beats: ['Politics'],
          beat_tags: [],
          work_mediums: ['Text'],
          availability: null,
        },
      ],
    });

    const [member] = await searchTalent({});

    expect(member.availableNow).toBe(false);
    expect(member.status).toBe('off');
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
