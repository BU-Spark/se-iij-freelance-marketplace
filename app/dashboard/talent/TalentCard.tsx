'use client';

import { RosterCard } from '../../components';
import type { TalentMember } from '../../types/talent.types';
import styles from './talent.module.css';

type TalentCardProps = {
  member: TalentMember;
  invited: boolean;
  onInvite: (member: TalentMember) => void;
};

export default function TalentCard({ member, invited, onInvite }: TalentCardProps) {
  return (
    <RosterCard
      member={member}
      footer={
        <div className={styles.footer}>
          <div className={styles.footerRow}>
            {invited ? (
              <span className={styles.invited}>Invited</span>
            ) : (
              <button
                type="button"
                className={styles.inviteSmall}
                aria-label={`Invite ${member.name} to your roster`}
                onClick={() => onInvite(member)}
              >
                Invite
              </button>
            )}
          </div>
        </div>
      }
    />
  );
}
