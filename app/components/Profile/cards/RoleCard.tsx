import InfoCard from '../../InfoCard/InfoCard';
import DetailList from '../../DetailList/DetailList';
import EditButton from './EditButton';
import { ROLE_CONFIG } from '../config/roleConfig';
import type { RoleDetails } from '../../../types/profile.types';
import styles from '../Profile.module.css';

type RoleCardProps = {
  details: RoleDetails;
  onEdit?: () => void;
};

export default function RoleCard({ details, onEdit }: RoleCardProps) {
  const config = ROLE_CONFIG[details.role];

  return (
    <InfoCard
      title={
        <span className={styles.pill} style={{ background: config.tint, color: config.ink }}>
          {config.label}
        </span>
      }
      accent={config.accent}
      action={onEdit && <EditButton label={`Edit ${config.label} details`} onClick={onEdit} />}
    >
      <div>
        <p className={styles.label}>Bio</p>
        <p className={styles.bio}>{details.bio || 'No bio yet.'}</p>
      </div>
      {/* the role config decides which facts to show and how to label them */}
      <DetailList
        columns={1}
        items={config.facts.map((f) => ({ label: f.label, value: details.facts[f.key] ?? '' }))}
      />
    </InfoCard>
  );
}
