'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import styles from './TagInput.module.css';
import { CHIP_COLORS } from '../../onboarding/constants';

type TagInputProps = {
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
  /** values offered under the field as the person types; picking one adds it like a typed tag */
  suggestions?: string[];
  /** names the text box for screen readers, which the surrounding tags would otherwise muddle */
  ariaLabel?: string;
};

/** More than this and the list stops being a shortcut */
const MAX_SUGGESTIONS = 8;

export default function TagInput({ tags, onChange, placeholder, suggestions, ariaLabel }: TagInputProps) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const query = value.trim().toLowerCase();
  // values already picked are not offered again
  const matches = (suggestions ?? [])
    .filter((option) => !tags.includes(option) && option.toLowerCase().includes(query))
    .slice(0, MAX_SUGGESTIONS);
  const showSuggestions = open && matches.length > 0;

  const add = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setValue('');
    setHighlighted(-1);
    setOpen(false);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % matches.length);
    } else if (showSuggestions && e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if ((e.key === 'Enter' || e.key === ',') && (value.trim() || highlighted >= 0)) {
      e.preventDefault();
      // keep the list's spelling when what they typed is already one of the options
      const typed = suggestions?.find((option) => option.toLowerCase() === query) ?? value;
      add(highlighted >= 0 ? matches[highlighted] : typed);
    } else if (e.key === 'Backspace' && !value && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className={styles.wrap} onClick={() => input.current?.focus()}>
      <div className={styles.tagInput}>
        {tags.map((t, i) => (
          <span key={t} className={styles.tag} style={{ ['--accent' as string]: CHIP_COLORS[i % CHIP_COLORS.length] }}>
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>
              ×
            </button>
          </span>
        ))}
        <input
          ref={input}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onKeyDown={onKey}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setHighlighted(-1);
          }}
          placeholder={tags.length ? '' : (placeholder ?? 'Premiere Pro, Datawrapper, Lightroom…')}
          aria-label={ariaLabel}
          role={suggestions ? 'combobox' : undefined}
          aria-expanded={suggestions ? showSuggestions : undefined}
          aria-controls={showSuggestions ? listId : undefined}
          aria-autocomplete={suggestions ? 'list' : undefined}
          aria-activedescendant={showSuggestions && highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
        />
      </div>
      {showSuggestions && (
        <ul className={styles.suggestions} id={listId} role="listbox">
          {matches.map((match, i) => (
            <li
              key={match}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === highlighted}
              className={styles.suggestion}
              // keep the focus in the input, so the click below still lands
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(match)}
            >
              {match}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
