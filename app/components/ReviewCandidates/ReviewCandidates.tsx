'use client';

import Modal from '../Modal/Modal';
import Avatar from '../Avatar/Avatar';
import type { DeskAssignment, RosterMember } from '../../types/dashboard.types';
import { candidatesFor } from '../../utils/dashboard.utils';
import styles from './ReviewCandidates.module.css';

type ReviewCandidatesProps = {
  assignment: DeskAssignment;
  roster: RosterMember[];
  /** called with the RosterMember id of the person picked */
  onAssign: (memberId: string) => void;
  onClose: () => void;
};

export default function ReviewCandidates({ assignment, roster, onAssign, onClose }: ReviewCandidatesProps) {
  const candidates = candidatesFor(assignment, roster);
  const invited = assignment.invitedIds?.length ?? 0;
  const interested = assignment.interestedIds.length;

  return (
    <Modal
      title={assignment.title}
      eyebrow={<span className={styles.tag}>{assignment.category}</span>}
      subtitle={`${invited} invited · ${interested} signaled interest. Pick one to assign.`}
      onClose={onClose}
    >
      {candidates.length === 0 ? (
        <p className={styles.empty}>Nobody has been invited or shown interest yet.</p>
      ) : (
        <ul className={styles.list}>
          {candidates.map(({ member, interested: isInterested }) => (
            <li key={member.id} className={styles.row}>
              <Avatar name={member.name} size={44} />
              <div className={styles.who}>
                <p className={styles.name}>{member.name}</p>
                <p className={styles.meta}>
                  {member.city} ·{' '}
                  {isInterested ? (
                    <span className={styles.interested}>
                      <span className={styles.dot} aria-hidden="true" />
                      Interested
                    </span>
                  ) : (
                    <em>Awaiting response</em>
                  )}
                </p>
              </div>
              {/* an editor can assign anyone they invited, even before the freelancer answers */}
              <button
                type="button"
                className={styles.assign}
                onClick={() => onAssign(member.id)}
                aria-label={`Assign ${member.name}`}
              >
                Assign
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
