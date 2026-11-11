import ProfileRow from './ProfileRow';
import { ROLE_CONFIG } from '../config/roleConfig';
import type { ProfileRole, RoleDetails } from '../../../types/profile.types';

type RoleRowProps = {
  details: RoleDetails;
  onOpen: () => void;
};

/** a pen for freelancers, a page of copy for editors */
const ROLE_ICON: Record<ProfileRole, string> = {
  freelancer: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z',
  editor: 'M4 4h12l4 4v12H4zM8 10h8M8 14h8M8 18h5',
};

export default function RoleRow({ details, onOpen }: RoleRowProps) {
  const config = ROLE_CONFIG[details.role];

  return (
    <ProfileRow
      label={config.label}
      ariaLabel={`Open ${config.label} details`}
      icon={ROLE_ICON[details.role]}
      accent={config.accent}
      tint={config.tint}
      ink={config.ink}
      onOpen={onOpen}
    />
  );
}
