import styles from './Avatar.module.css';
import { initials } from '../../utils/dashboard.utils';

// Soft background + darker text colour pairs for the initials tile
const PALETTE = [
  { bg: '#E3EAFE', fg: '#2849B8' },
  { bg: '#FBE6EF', fg: '#A0285C' },
  { bg: '#E2F4EF', fg: '#16695A' },
  { bg: '#F1E8FD', fg: '#6236B0' },
  { bg: '#FFF1DE', fg: '#8A4B00' },
];

// Same name always gets the same colour
function colorFor(name: string) {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return PALETTE[sum % PALETTE.length];
}

type AvatarProps = {
  name: string;
  size?: number;
};

export default function Avatar({ name, size = 44 }: AvatarProps) {
  const { bg, fg } = colorFor(name);
  return (
    <span className={styles.avatar} style={{ width: size, height: size, background: bg, color: fg }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
