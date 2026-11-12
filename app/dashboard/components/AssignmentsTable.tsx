'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AssignmentStatus, DeskAssignment } from '../../types/dashboard.types';
import { formatDeadline } from '../../utils/dashboard.utils';
import { organizationName } from '../../utils/organization.utils';
import styles from '../dashboard.module.css';

const STATUS_LABEL: Record<AssignmentStatus, string> = {
  open: 'Open',
  invited: 'Invited',
  assigned: 'Assigned',
};

type AssignmentsTableProps = {
  assignments: DeskAssignment[];
  /** the freelancer each assignment is assigned to, by member id */
  assignedName: (id?: string) => string | undefined;
  /** if given, rows offer the same Review candidates popup the cards do */
  onReview?: (assignmentId: string) => void;
};

/**
 * The dense desk view: one row per assignment so a long list fits on screen and the columns line
 * up. The whole row opens the assignment drawer (the title is a link for keyboard and new-tab
 * use), and an arrow marks that the row is the way in.
 */
export default function AssignmentsTable({ assignments, assignedName, onReview }: AssignmentsTableProps) {
  const router = useRouter();

  const open = (assignment: DeskAssignment) => {
    if (assignment.href) router.push(assignment.href, { scroll: false });
  };

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        {/* the column heading already says "Assignments"; the caption only names the table for screen readers */}
        <caption className={styles.srOnly}>Assignments</caption>
        <thead>
          <tr>
            <th scope="col">Assignment</th>
            <th scope="col">Category</th>
            <th scope="col">Status</th>
            <th scope="col">Deadline</th>
            <th scope="col">Candidates</th>
            <th scope="col">Assigned to</th>
            <th scope="col">
              <span className={styles.srOnly}>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => {
            const organization = organizationName(a.organizationId);
            const name = assignedName(a.assignedToId);
            const canReview = onReview && a.status !== 'assigned' && a.interestedIds.length > 0;

            return (
              <tr key={a.id} className={a.href ? styles.clickableRow : undefined} onClick={() => open(a)}>
                <th scope="row" className={styles.tableTitle}>
                  {a.href ? (
                    <Link href={a.href} scroll={false}>
                      {a.title}
                    </Link>
                  ) : (
                    a.title
                  )}
                  {organization && <span className={styles.tableSub}>{organization}</span>}
                </th>
                <td data-label="Category">{a.category || '—'}</td>
                <td data-label="Status">{STATUS_LABEL[a.status]}</td>
                <td data-label="Deadline">{a.deadline ? formatDeadline(a.deadline) : '—'}</td>
                <td data-label="Candidates">
                  {a.status === 'assigned' ? '—' : `${a.interestedIds.length} interested`}
                </td>
                <td data-label="Assigned to">{name ?? '—'}</td>
                <td className={styles.tableAction}>
                  <span className={styles.tableActions}>
                    {canReview && (
                      <button
                        type="button"
                        className={styles.tableReview}
                        onClick={(event) => {
                          // the row itself opens the assignment, so the button must not
                          event.stopPropagation();
                          onReview(a.id);
                        }}
                      >
                        Review
                      </button>
                    )}
                    {a.href && (
                      <span className={styles.rowArrow} aria-hidden="true">
                        ›
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
