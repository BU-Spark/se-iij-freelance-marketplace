import { ChipGroup, Section } from '../../components';
import styles from '../profile.module.css';

const DESKS = [
  'Reporting/Writing',
  'Editing',
  'Audience Engagement',
  'Grant/Sponsorship Proposals',
  'Visuals',
  'Multimedia',
];

type Props = { selected: string[]; onChange: (desks: string[]) => void };

export function DesksSection({ selected, onChange }: Props) {
  const toggle = (desk: string) =>
    onChange(selected.includes(desk) ? selected.filter((item) => item !== desk) : [...selected, desk]);

  return (
    <Section title="Desks you staff" color="var(--c-red)">
      <p className={styles.hint}>Freelancers filter by these when they pitch.</p>
      <ChipGroup options={DESKS} selected={selected} onToggle={toggle} />
    </Section>
  );
}
