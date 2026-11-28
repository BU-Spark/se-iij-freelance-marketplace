import { PREFIX_BONUS, RELEVANCE_WEIGHTS, rankBy, relevanceScore, type RelevanceField } from './relevance.utils';

describe('relevanceScore', () => {
  it('scores nothing for an empty search', () => {
    expect(relevanceScore('   ', [{ text: 'Politics', weight: 8 }])).toBe(0);
  });

  it('weights the field a word was found in, not just how many words were found', () => {
    const name: RelevanceField = { text: 'Marcus Thorne', weight: RELEVANCE_WEIGHTS.name };
    const bio: RelevanceField = { text: 'Covers politics', weight: RELEVANCE_WEIGHTS.bio };

    expect(relevanceScore('politics', [name, bio])).toBe(RELEVANCE_WEIGHTS.bio);
    expect(relevanceScore('marcus', [name, bio])).toBe(RELEVANCE_WEIGHTS.name + PREFIX_BONUS);
  });

  it('adds a word once per field and ignores word order', () => {
    const fields: RelevanceField[] = [
      { text: 'Marcus Thorne', weight: RELEVANCE_WEIGHTS.name },
      { text: 'London', weight: RELEVANCE_WEIGHTS.location },
    ];

    expect(relevanceScore('london marcus', fields)).toBe(
      relevanceScore('marcus', fields) + relevanceScore('london', fields)
    );
  });

  it('rewards a word that starts a beat over one that only appears inside it', () => {
    const beats: RelevanceField = {
      values: ['Politics', 'Metropolitan Desk'],
      weight: RELEVANCE_WEIGHTS.beat,
    };

    expect(relevanceScore('pol', [beats])).toBe(RELEVANCE_WEIGHTS.beat + PREFIX_BONUS);
  });

  it('counts a list field once even when several entries match', () => {
    const tags: RelevanceField = { values: ['Housing', 'Housing policy'], weight: RELEVANCE_WEIGHTS.tag };

    expect(relevanceScore('housing', [tags])).toBe(RELEVANCE_WEIGHTS.tag + PREFIX_BONUS);
  });

  it('ignores case, accepts words in any order, and scores a miss as zero', () => {
    const fields: RelevanceField[] = [
      { text: 'Marcus Thorne', weight: RELEVANCE_WEIGHTS.name },
      { text: 'London', weight: RELEVANCE_WEIGHTS.location },
    ];

    expect(relevanceScore('LONDON marcus', fields)).toBe(
      relevanceScore('marcus', fields) + relevanceScore('london', fields)
    );
    expect(relevanceScore('berlin', fields)).toBe(0);
  });

  it('treats wildcard characters as literal text', () => {
    const fields: RelevanceField[] = [{ text: 'an award-winning 100% local outlet', weight: RELEVANCE_WEIGHTS.bio }];

    // '%' and '_' are LIKE wildcards in the database, but a search is plain text here
    expect(relevanceScore('100%', fields)).toBe(RELEVANCE_WEIGHTS.bio);
    expect(relevanceScore('_', fields)).toBe(0);
  });
});

describe('rankBy', () => {
  const row = (name: string, bio: string) => ({ name, bio });
  const fieldsOf = (item: { name: string; bio: string }): RelevanceField[] => [
    { text: item.name, weight: RELEVANCE_WEIGHTS.name },
    { text: item.bio, weight: RELEVANCE_WEIGHTS.bio },
  ];

  it('puts the better matches first and leaves the list alone without a query', () => {
    const rows = [row('Sam', 'Writes about climate'), row('Climate Desk', 'Anything')];

    expect(rankBy(rows, 'climate', fieldsOf).map((item) => item.name)).toEqual(['Climate Desk', 'Sam']);
    expect(rankBy(rows, '', fieldsOf)).toBe(rows);
  });

  it('falls back to the caller’s order when scores tie, even with no query', () => {
    const rows = [
      { name: 'Zed', bio: '', deadline: 2 },
      { name: 'Amy', bio: '', deadline: 1 },
    ];
    const byDeadline = (a: (typeof rows)[number], b: (typeof rows)[number]) => a.deadline - b.deadline;

    expect(rankBy(rows, 'nothing matches', fieldsOf, byDeadline).map((item) => item.name)).toEqual(['Amy', 'Zed']);
    expect(rankBy(rows, '', fieldsOf, byDeadline).map((item) => item.name)).toEqual(['Amy', 'Zed']);
  });
});
