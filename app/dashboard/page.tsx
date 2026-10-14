import { Header } from '../components/header/Header';
import styles from './dashboard.module.css';
import { ASSIGNMENTS, EDITOR_NAME, NEW_PITCHES, ROSTER } from './constants';
import {
  countByStatus,
  countOnRoster,
  formatDeadline,
  formatDeskDate,
  formatRate,
  hourSlots,
  SLOT_STARTS,
  slotLabel,
} from '../utils/dashboard.utils';

/*
 * Dashboard: shows the sample data as plain text.
 * Cards and styling come in the next PRs.
 */

export default function Dashboard() {
  const counts = countByStatus(ASSIGNMENTS);

  return (
    <div className={styles.shell}>
      <Header />

      {/* ---- Status bar ---- */}
      <div className={styles.statusBar}>
        <p>
          <strong>{formatDeskDate(new Date())}</strong> • Editor: {EDITOR_NAME} • {NEW_PITCHES} new pitches in inbox →
        </p>
        <p>
          {counts.open} open • {counts.invited} pending • {counts.assigned} assigned
        </p>
      </div>

      <main className={styles.columns}>
        {/* ---- Left column: who is available ---- */}
        <section aria-labelledby="availability-heading">
          <div className={styles.sectionHead}>
            <div>
              <h2 id="availability-heading">Availability</h2>
              <p>
                {countOnRoster(ROSTER)} of {ROSTER.length} on roster
              </p>
            </div>
            <div className={styles.toggles}>
              <button type="button">day</button>
              <button type="button">week</button>
              <button type="button">month</button>
            </div>
          </div>

          <ul className={styles.list}>
            {ROSTER.map((m) => {
              const slots = hourSlots(m.openHours);
              return (
                <li key={m.id} className={styles.placeholder}>
                  <h3>{m.name}</h3>
                  <p>
                    {m.specialty} • {m.city}
                  </p>
                  <p>{m.status}</p>
                  <p>
                    Free:{' '}
                    {SLOT_STARTS.filter((_, i) => slots[i])
                      .map(slotLabel)
                      .join(' ') || 'none today'}
                  </p>
                  <p>{m.note}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---- Right column: assignments ---- */}
        <section aria-labelledby="assignments-heading">
          <div className={styles.sectionHead}>
            <h2 id="assignments-heading">Assignments</h2>
            <div className={styles.toggles}>
              <button type="button">All</button>
              <button type="button">Open</button>
              <button type="button">Invited</button>
              <button type="button">Assigned</button>
            </div>
          </div>

          <ul className={styles.list}>
            {ASSIGNMENTS.map((a) => (
              <li key={a.id} className={styles.placeholder}>
                <article>
                  <p>
                    {a.category} • {a.urgent ? 'Urgent' : a.status}
                  </p>
                  <h3>{a.title}</h3>
                  <p>
                    Point of Contact: {a.contact.name}, {a.contact.desk}
                  </p>
                  <p>Deadline: {formatDeadline(a.deadline)}</p>
                  <p>
                    Location: {a.location} • Length: {a.length} • Type: {a.type} • Rate: {formatRate(a.rate)}
                  </p>
                  <p>{a.interestedIds.length} interested</p>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
