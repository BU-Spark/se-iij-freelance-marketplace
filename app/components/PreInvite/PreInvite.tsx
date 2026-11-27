import type { RosterMember } from '../../types/dashboard.types';
import { PRE_INVITE_LABEL, canPreInvite, preInviteState } from '../../utils/favorites.utils';
import styles from './PreInvite.module.css';

type PreInviteProps = {
  member: RosterMember;
  busy?: boolean;
  onPreInvite: (member: RosterMember) => void;
};

/** Where a favorite's pre-invitation stands, plus the button to send one when that is possible */
export default function PreInvite({ member, busy = false, onPreInvite }: PreInviteProps) {
  const state = preInviteState(member);

  return (
    <span className={styles.preInvite}>
      {state !== 'none' && <span className={`${styles.status} ${styles[state]}`}>{PRE_INVITE_LABEL[state]}</span>}
      {canPreInvite(member) && (
        <button
          type="button"
          className={styles.send}
          aria-label={`${state === 'declined' ? 'Pre-invite again' : 'Pre-invite'} ${member.name}`}
          disabled={busy}
          onClick={() => onPreInvite(member)}
        >
          {state === 'declined' ? 'Invite again' : 'Pre-invite'}
        </button>
      )}
    </span>
  );
}
