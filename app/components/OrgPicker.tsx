'use client';

import { useState } from 'react';
import styles from './OrgPicker.module.css';
import type { OrgOption } from '../types/onboarding.types';

type OrgPickerProps = {
  orgs: OrgOption[];
  selected: string;
  onSelect: (id: string) => void;
  onAdd: (o: OrgOption) => void;
};

export default function OrgPicker({ orgs, selected, onSelect, onAdd }: OrgPickerProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const save = () => {
    if (!name.trim()) return;
    onAdd({ id: `org-${Date.now()}`, name: name.trim(), city: city.trim() || '—' });
    setName('');
    setCity('');
    setAdding(false);
  };

  return (
    <div className={styles.orgGrid}>
      {orgs.map((o) => (
        <button
          key={o.id}
          type="button"
          className={styles.orgCard}
          data-active={selected === o.id}
          onClick={() => onSelect(o.id)}
        >
          <strong>{o.name}</strong>
          <span>{o.city}</span>
        </button>
      ))}

      {adding ? (
        <div className={`${styles.orgAdd} ${styles.fadeIn}`}>
          <input autoFocus placeholder="Newsroom name" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <div className={styles.orgAddActions}>
            <button type="button" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button type="button" className={styles.miniPrimary} onClick={save}>
              Add
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.orgNew} onClick={() => setAdding(true)}>
          <span>＋</span> Add new organization
        </button>
      )}
    </div>
  );
}
