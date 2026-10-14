'use client';

import { useState, type KeyboardEvent } from 'react';
import styles from './TagInput.module.css';
import { CHIP_COLORS } from '../../onboarding/constants';

type TagInputProps = {
  tags: string[];
  onChange: (t: string[]) => void;
};

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [value, setValue] = useState('');

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && value.trim()) {
      e.preventDefault();
      if (!tags.includes(value.trim())) onChange([...tags, value.trim()]);
      setValue('');
    } else if (e.key === 'Backspace' && !value && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
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
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        placeholder={tags.length ? '' : 'Premiere Pro, Datawrapper, Lightroom…'}
      />
    </div>
  );
}
