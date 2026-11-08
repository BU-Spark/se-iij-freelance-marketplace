'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { SearchBox } from '../../components/search/SearchBox';
import styles from '../dashboard.module.css';

const HIGHLIGHT = 'page-search';
// Inline because Turbopack's CSS parser doesn't recognize ::highlight() yet
const HIGHLIGHT_STYLE = `::highlight(${HIGHLIGHT}) { background-color: #ffe58a; color: var(--ink); }`;
const MAX_RESULTS = 8;
const SNIPPET_RADIUS = 30;

type Result = {
  target: HTMLElement;
  title: string;
  section: string;
  before: string;
  match: string;
  after: string;
};

/** The card (or list item) a match belongs to, which is where clicking a result goes */
const itemFor = (el: HTMLElement, root: HTMLElement) =>
  (el.closest('article, li') as HTMLElement | null) ?? (root.contains(el) ? el : root);

const textOf = (el: Element | null | undefined) => el?.textContent?.trim() ?? '';

/** A short window of text around the match, so the option shows it in context */
function snippet(text: string, at: number, length: number) {
  const start = Math.max(0, at - SNIPPET_RADIUS);
  const end = Math.min(text.length, at + length + SNIPPET_RADIUS);
  return {
    before: (start > 0 ? '…' : '') + text.slice(start, at).trimStart(),
    match: text.slice(at, at + length),
    after: text.slice(at + length, end).trimEnd() + (end < text.length ? '…' : ''),
  };
}

/**
 * Generic page search: highlights every match inside the element with `targetId` and lists
 * the cards they're in. Picking one opens the card's link (its expanded view) when it has one,
 * otherwise scrolls to the card. It does not filter anything yet.
 */
export default function PageSearch({ targetId }: { targetId: string }) {
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Find matches in the page text, highlight them, and group them by card
  useEffect(() => {
    const highlights = typeof CSS !== 'undefined' ? CSS.highlights : undefined;
    const root = document.getElementById(targetId);
    const needle = query.trim().toLowerCase();

    highlights?.delete(HIGHLIGHT);
    setActive(0);
    if (!root || !needle) {
      setResults([]);
      setTotal(0);
      return;
    }

    const ranges: Range[] = [];
    const byItem = new Map<HTMLElement, Result>();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const raw = node.textContent ?? '';
      const text = raw.toLowerCase();
      const parent = node.parentElement;
      if (!parent) continue;

      for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + needle.length)) {
        const range = new Range();
        range.setStart(node, at);
        range.setEnd(node, at + needle.length);
        ranges.push(range);

        const item = itemFor(parent, root);
        if (byItem.has(item)) continue;
        const section = parent.closest('section, aside, div[aria-labelledby]')?.querySelector('h2');
        byItem.set(item, {
          target: item,
          title: textOf(item.querySelector('h3, h2')) || textOf(parent),
          section: textOf(section),
          ...snippet(raw, at, needle.length),
        });
      }
    }

    setTotal(ranges.length);
    setResults([...byItem.values()].slice(0, MAX_RESULTS));
    if (highlights && ranges.length) highlights.set(HIGHLIGHT, new Highlight(...ranges));

    return () => {
      highlights?.delete(HIGHLIGHT);
    };
  }, [query, targetId]);

  // Close the list when clicking anywhere else
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const goTo = (result: Result) => {
    setOpen(false);

    // Cards that link to an expanded view (e.g. an assignment's detail page) open it;
    // clicking the card's own link keeps Next's client-side navigation
    const link =
      result.target.querySelector<HTMLAnchorElement>('h3 a[href], h2 a[href]') ??
      result.target.querySelector<HTMLAnchorElement>('a[href]');
    if (link) {
      link.click();
      return;
    }

    // Otherwise just bring the card into view
    result.target.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    // Brief glow so it's obvious which card the search landed on
    result.target.animate?.(
      [{ boxShadow: '0 0 0 4px rgba(255, 213, 79, 0.9)' }, { boxShadow: '0 0 0 4px rgba(255, 213, 79, 0)' }],
      { duration: 1600, easing: 'ease-out' }
    );
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') return setOpen(false);
    if (!results.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + results.length) % results.length);
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      goTo(results[active]);
    }
  };

  const hasQuery = query.trim().length > 0;
  const showList = open && hasQuery;

  return (
    <div ref={wrapperRef} className={styles.pageSearch}>
      <style>{HIGHLIGHT_STYLE}</style>
      <SearchBox
        aria-label="Search the dashboard"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showList}
        aria-activedescendant={showList && results.length ? `${listId}-${active}` : undefined}
        role="combobox"
        placeholder="Search..."
        shortcut=""
        value={query}
        onChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {showList && (
        <ul id={listId} role="listbox" aria-label="Search results" className={styles.searchResults}>
          {results.length === 0 ? (
            <li className={styles.searchEmpty}>No matches on this page</li>
          ) : (
            results.map((r, i) => (
              <li
                key={i}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={styles.searchOption}
                onMouseEnter={() => setActive(i)}
                // mousedown so the input doesn't lose focus and close the list first
                onMouseDown={(event) => {
                  event.preventDefault();
                  goTo(r);
                }}
              >
                <span className={styles.searchOptionHead}>
                  <strong>{r.title}</strong>
                  {r.section && <span>{r.section}</span>}
                </span>
                <span className={styles.searchSnippet}>
                  {r.before}
                  <mark>{r.match}</mark>
                  {r.after}
                </span>
              </li>
            ))
          )}
        </ul>
      )}

      {hasQuery && (
        <span className={styles.matchCount} role="status">
          {total === 1 ? '1 match' : `${total} matches`}
        </span>
      )}
    </div>
  );
}
