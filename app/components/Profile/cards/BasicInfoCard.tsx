import Avatar from '../../Avatar/Avatar';
import InfoCard from '../../InfoCard/InfoCard';
import DetailList from '../../DetailList/DetailList';
import EditButton from './EditButton';
import type { BasicInfo } from '../../../types/profile.types';
import styles from '../Profile.module.css';

type BasicInfoCardProps = {
  basic: BasicInfo;
  /** if given, shows an Edit button in the card's title row */
  onEdit?: () => void;
};

export default function BasicInfoCard({ basic, onEdit }: BasicInfoCardProps) {
  const name = `${basic.firstName} ${basic.lastName}`.trim();

  return (
    <InfoCard title="Basic info" action={onEdit && <EditButton label="Edit basic info" onClick={onEdit} />}>
      <div className={styles.who}>
        <Avatar name={name} size={64} />
        <p className={styles.name}>{name}</p>
      </div>
      <DetailList
        items={[
          { label: 'First name', value: basic.firstName },
          { label: 'Last name', value: basic.lastName },
          { label: 'Email', value: basic.email, wide: true },
          { label: 'Location', value: basic.location, wide: true },
        ]}
      />
    </InfoCard>
  );
}
