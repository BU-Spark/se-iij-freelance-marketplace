import { OrgPicker, Section } from '../../components';
import type { OrgOption } from '../../types/onboarding.types';

type Props = {
  organizations: OrgOption[];
  selected: string;
  onSelect: (id: string) => void;
  onAdd: (organization: OrgOption) => void;
};

export function OrganizationSection({ organizations, selected, onSelect, onAdd }: Props) {
  return (
    <Section title="Organization" hint="Pick your newsroom, or add one that isn't listed." color="var(--c-amber)">
      <OrgPicker orgs={organizations} selected={selected} onSelect={onSelect} onAdd={onAdd} />
    </Section>
  );
}
