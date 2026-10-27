// Colour of the small marker next to a category name (cards, pitches)
const CATEGORY_COLOR: Record<string, string> = {
  'Reporting/Writing': '#2f55d4',
  Editing: '#c2417a',
  'Audience Engagement': '#0f7b8a',
  'Grant/Sponsorship Proposals': '#b5651d',
  Visuals: '#d98a00',
  Photo: '#d98a00',
  Multimedia: '#7a3fc2',
  Data: '#1f8a70',
};

/** The colour for a category, or grey if it's one we don't know yet */
export function categoryColor(category: string): string {
  return CATEGORY_COLOR[category] ?? '#5f6878';
}
