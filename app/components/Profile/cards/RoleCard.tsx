import InfoCard from '../../InfoCard/InfoCard';
import DetailList from '../../DetailList/DetailList';
import EditButton from './EditButton';
import { ROLE_CONFIG } from '../config/roleConfig';
import { DEFAULT_ORGS } from '../../../onboarding/constants';
import { factText } from '../../../utils/profile.utils';
import type { RoleDetails } from '../../../types/profile.types';
import styles from '../Profile.module.css';

type RoleCardProps = {
  details: RoleDetails;
  onEdit?: () => void;
};

/** The row stores the organisation id; people recognise the name */
const organizationName = (id: string) => DEFAULT_ORGS.find((org) => org.id === id)?.name ?? id;

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
      {/* the role config decides which fields to show and how to label them */}
      <DetailList
        columns={1}
        items={config.fields.map((field) => ({
          label: field.label,
          value: factText(details.facts[field.key], field.type === 'org' ? organizationName : undefined),
        }))}
      />
    </InfoCard>
  );
}
