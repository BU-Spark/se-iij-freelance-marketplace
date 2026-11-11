'use client';

import { useState } from 'react';
import type { AvailabilityException, Weekday } from '../../types/availability.types';
import { WEEKDAYS, addDays, addMonths, dateKeyIn, dayOfWeek, monthOf } from '../../utils/availability.utils';
import styles from './availability.module.css';

/** Monday-first column headers, matching the week strip on the roster cards */
const COLUMNS = [
  { key: 'monday', short: 'M', long: 'Monday' },
  { key: 'tuesday', short: 'T', long: 'Tuesday' },
  { key: 'wednesday', short: 'W', long: 'Wednesday' },
  { key: 'thursday', short: 'T', long: 'Thursday' },
  { key: 'friday', short: 'F', long: 'Friday' },
  { key: 'saturday', short: 'S', long: 'Saturday' },
  { key: 'sunday', short: 'S', long: 'Sunday' },
];

/** How far ahead a date can be marked; a year of exceptions is plenty to plan */
const MONTHS_AHEAD = 11;

type AvailabilityCalendarProps = {
  /** the weekly pattern, so untouched dates can show what they will do */
  days: Weekday[];
  exceptions: AvailabilityException[];
  timezone: string;
  /** advances one date to the next state in the cycle */
  onToggle: (date: string) => void;
};

/** "Wed, Nov 4" — built in UTC from the date key so the browser zone cannot move it */
const dayLabel = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));

const monthLabel = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`)
  );

/** A real month grid where clicking a day marks it off, free, or back to the usual week */
export default function AvailabilityCalendar({ days, exceptions, timezone, onToggle }: AvailabilityCalendarProps) {
  const today = dateKeyIn(new Date(), timezone);
  const thisMonth = monthOf(today);
  const lastMonth = addMonths(thisMonth, MONTHS_AHEAD);

  const [month, setMonth] = useState(thisMonth);

  const [year, monthNumber] = month.split('-').map(Number);
  const leading = dayOfWeek(month);
  const length = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length }, (_, offset) => addDays(month, offset)),
  ];

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHead}>
        <button
          type="button"
          className={styles.monthNav}
          aria-label="Previous month"
          disabled={month <= thisMonth}
          onClick={() => setMonth(addMonths(month, -1))}
        >
          ‹
        </button>
        <strong aria-live="polite">{monthLabel(month)}</strong>
        <button
          type="button"
          className={styles.monthNav}
          aria-label="Next month"
          disabled={month >= lastMonth}
          onClick={() => setMonth(addMonths(month, 1))}
        >
          ›
        </button>
      </div>

      <ul className={styles.calendarWeek} aria-hidden="true">
        {COLUMNS.map((column) => (
          <li key={column.key}>{column.short}</li>
        ))}
      </ul>

      <ul className={styles.calendarGrid} aria-label={`Dates in ${monthLabel(month)}`}>
        {cells.map((date, index) => {
          if (!date) return <li key={`blank-${index}`} />;

          const exception = exceptions.find((entry) => entry.date === date);
          const free = exception ? exception.available : days.includes(WEEKDAYS[dayOfWeek(date)]);
          const marks = [
            free ? 'free' : 'not free',
            exception ? 'just for this date' : 'your usual week',
            date === today ? 'today' : '',
          ]
            .filter(Boolean)
            .join(', ');

          return (
            <li key={date}>
              <button
                type="button"
                className={free ? styles.freeDay : styles.busyDay}
                disabled={date < today}
                aria-label={`${dayLabel(date)}: ${marks}`}
                title={`${dayLabel(date)} — ${marks}`}
                onClick={() => onToggle(date)}
              >
                {Number(date.slice(8))}
              </button>
            </li>
          );
        })}
      </ul>

      <p className={styles.legend}>
        <span className={`${styles.swatch} ${styles.freeDay}`} aria-hidden="true" /> free
        <span className={`${styles.swatch} ${styles.busyDay}`} aria-hidden="true" /> not free
      </p>
    </div>
  );
}
