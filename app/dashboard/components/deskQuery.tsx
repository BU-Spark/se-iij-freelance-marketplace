'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type DeskQuery = {
  /** what the editor typed in the desk search, already trimmed by the filter helpers */
  query: string;
  setQuery: (query: string) => void;
};

const NO_OP: DeskQuery = { query: '', setQuery: () => {} };

const DeskQueryContext = createContext<DeskQuery>(NO_OP);

/**
 * The desk's search box sits in the status bar, but it filters two columns that are siblings of
 * it, so the query lives above both of them rather than being pushed through props.
 */
export function DeskQueryProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const value = useMemo(() => ({ query, setQuery }), [query]);

  return <DeskQueryContext.Provider value={value}>{children}</DeskQueryContext.Provider>;
}

/** Safe outside the provider too (tests, Storybook): the query is simply empty. */
export function useDeskQuery(): DeskQuery {
  return useContext(DeskQueryContext);
}
