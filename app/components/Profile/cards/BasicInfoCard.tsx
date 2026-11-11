import InfoCard from '../../InfoCard/InfoCard';
import DetailList from '../../DetailList/DetailList';
import EditButton from './EditButton';
import type { BasicInfo } from '../../../types/profile.types';

type BasicInfoCardProps = {
  basic: BasicInfo;
  /** if given, shows an Edit button in the card's title row */
  onEdit?: () => void;
};

export default function BasicInfoCard({ basic, onEdit }: BasicInfoCardProps) {
  return (
    <InfoCard title="Basic info" action={onEdit && <EditButton label="Edit basic info" onClick={onEdit} />}>
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
