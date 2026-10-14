'use client';

import { useState, type ChangeEvent, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import styles from './SearchBox.module.css';
import { SearchIcon } from '../icons/SearchIcon';

type SearchBoxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'defaultValue' | 'onChange' | 'type' | 'value'> & {
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  compact?: boolean;
  shortcut?: string;
  value?: string;
};

export function SearchBox({
  'aria-label': ariaLabel = 'Search',
  className,
  defaultValue = '',
  onChange,
  onSearch,
  onKeyDown,
  compact = false,
  placeholder = 'Search...',
  shortcut = '⌘K',
  value,
  ...inputProps
}: SearchBoxProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const inputValue = value ?? internalValue;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.key === 'Enter') onSearch?.(inputValue.trim());
  };

  return (
    <div className={`${styles.searchBox} ${compact ? styles.compact : ''}${className ? ` ${className}` : ''}`}>
      <SearchIcon className={styles.icon} />
      <input
        {...inputProps}
        aria-label={ariaLabel}
        className={styles.input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        type="search"
        value={inputValue}
      />
      {shortcut && <kbd className={styles.shortcut}>{shortcut}</kbd>}
    </div>
  );
}
