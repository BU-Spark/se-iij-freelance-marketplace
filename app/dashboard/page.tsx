import { Header } from '../components/header/Header';
import styles from './dashboard.module.css';

/*
 * Dashboard skeleton: every section of the design is in place with placeholder text.
 * Real data, cards and styling come in the next PRs.
 */

const ROSTER_PLACEHOLDERS = [1, 2, 3];
const ASSIGNMENT_PLACEHOLDERS = [1, 2];

export default function Dashboard() {
  return (
    <div className={styles.shell}>
      <Header />

      {/* ---- Status bar ---- */}
      <div className={styles.statusBar}>
        <p>[Today&apos;s date] • Editor: [Editor name] • [N] new pitches in inbox →</p>
        <p>[N] open • [N] pending • [N] assigned</p>
      </div>

      <main className={styles.columns}>
        {/* ---- Left column: who is available ---- */}
        <section aria-labelledby="availability-heading">
          <div className={styles.sectionHead}>
            <div>
              <h2 id="availability-heading">Availability</h2>
              <p>[N] of [N] on roster</p>
            </div>
            <div className={styles.toggles}>
              <button type="button">day</button>
              <button type="button">week</button>
              <button type="button">month</button>
            </div>
          </div>

          <ul className={styles.list}>
            {ROSTER_PLACEHOLDERS.map((n) => (
              <li key={n} className={styles.placeholder}>
                <h3>[Freelancer name]</h3>
                <p>[Specialty] • [City]</p>
                <p>[Status]</p>
                <p>[Availability bar: 8a 10a 12p 2p 4p 6p]</p>
                <p>[Availability note]</p>
              </li>
            ))}
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
            {ASSIGNMENT_PLACEHOLDERS.map((n) => (
              <li key={n} className={styles.placeholder}>
                <article>
                  <p>[Category] [Tag]</p>
                  <h3>[Assignment title]</h3>
                  <p>Point of Contact: [Name], [Desk]</p>
                  <p>Deadline: [Deadline]</p>
                  <p>Location: [Location] • Length: [Length] • Type: [Type] • Rate: [Rate]</p>
                  <p>[N] freelancers interested • Review candidates →</p>
                  <p>View full details →</p>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
