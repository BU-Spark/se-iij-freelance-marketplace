/**
 * How strongly a match counts, by where it was found. `lib/talent.ts` interpolates the same numbers
 * into its SQL, so Find talent and the desk rank a search the same way.
 */
export const RELEVANCE_WEIGHTS = {
  // the headline of a person or post outranks two weaker mentions further down the card
  name: 12,
  title: 12,
  beat: 6,
  category: 5,
  tag: 5,
  contact: 4,
  medium: 4,
  type: 3,
  location: 3,
  organization: 3,
  community: 2,
  bio: 2,
  description: 2,
  /** the Beat filter matched the person's headline beat / only a secondary tag */
  filterBeat: 6,
  filterBeatTag: 3,
} as const;

/** A word that starts a value counts extra: "pol" should favour "Politics" over "Metropolitan" */
export const PREFIX_BONUS = 2;

/** One place a query word can be found; `values` is for list fields like beats or tools */
export type RelevanceField = {
  text?: string | null;
  values?: (string | null | undefined)[];
  weight: number;
};

const wordsOf = (query: string) => query.trim().toLowerCase().split(/\s+/).filter(Boolean);

/**
 * A result's score for a search: every query word adds its field's weight once per field it appears
 * in, plus a prefix bonus. Filters that already decide whether a row matches are not scored here.
 */
export function relevanceScore(query: string, fields: RelevanceField[]): number {
  const words = wordsOf(query);
  if (words.length === 0) return 0;

  // lowered once, since every word is checked against every value
  const values = fields.map((field) => ({
    weight: field.weight,
    entries: (field.values ?? [field.text])
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.toLowerCase()),
  }));

  return words.reduce(
    (total, word) =>
      total +
      values.reduce((sum, field) => {
        // a list counts once however many of its entries match, like a single field would
        const matches = field.entries.filter((entry) => entry.includes(word));
        if (matches.length === 0) return sum;
        return sum + field.weight + (matches.some((entry) => entry.startsWith(word)) ? PREFIX_BONUS : 0);
      }, 0),
    0
  );
}

/**
 * Relevance first, then the caller's tie-break. With no search text the list keeps its own order
 * (or is sorted by the tie-break alone), so nothing moves until someone actually searches.
 */
export function rankBy<T>(
  items: T[],
  query: string,
  fieldsOf: (item: T) => RelevanceField[],
  tieBreak?: (a: T, b: T) => number
): T[] {
  if (wordsOf(query).length === 0) return tieBreak ? [...items].sort(tieBreak) : items;

  const ranked = items.map((item, index) => ({ item, index, score: relevanceScore(query, fieldsOf(item)) }));
  ranked.sort((a, b) => b.score - a.score || (tieBreak ? tieBreak(a.item, b.item) : a.index - b.index));

  return ranked.map(({ item }) => item);
}
