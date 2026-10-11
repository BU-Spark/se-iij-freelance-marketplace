export type ClipType = 'article' | 'social' | 'broadcast';

export type PortfolioItem = {
  id: string;
  type: ClipType;
  title: string;
  description?: string;
  url: string;
};
