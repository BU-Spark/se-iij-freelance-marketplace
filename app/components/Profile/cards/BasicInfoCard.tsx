import InfoCard from '../../InfoCard/InfoCard';
import DetailList from '../../DetailList/DetailList';
import EditButton from './EditButton';
import type { BasicInfo } from '../../../types/profile.types';
import styles from '../Profile.module.css';

type BasicInfoCardProps = {
  basic: BasicInfo;
  /** if given, shows an Edit button in the card's title row */
  onEdit?: () => void;
  /** if given, shows the "free right now" switch */
  onToggleAvailable?: (availableNow: boolean) => void;
};

export default function BasicInfoCard({ basic, onEdit, onToggleAvailable }: BasicInfoCardProps) {
  return (
    <InfoCard title="Basic info" action={onEdit && <EditButton label="Edit basic info" onClick={onEdit} />}>
      {onToggleAvailable && (
        <button
          type="button"
          role="switch"
          aria-checked={basic.availableNow}
          className={styles.availableToggle}
          onClick={() => onToggleAvailable(!basic.availableNow)}
        >
          <span>Free right now</span>
          <span className={styles.availableTrack} data-on={basic.availableNow} aria-hidden="true">
            <span className={styles.availableThumb} />
          </span>
        </button>
      )}
      <DetailList
        items={[
          { label: 'First name', value: basic.firstName },
          { label: 'Last name', value: basic.lastName },
          { label: 'Email', value: basic.email, wide: true },
          { label: 'Short bio', value: basic.shortBio, wide: true },
          { label: 'Long bio', value: basic.longBio, wide: true },
        ]}
      />
    </InfoCard>
  );
}
