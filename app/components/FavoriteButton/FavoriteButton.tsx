import { HeartIcon } from '../icons/HeartIcon';
import styles from './FavoriteButton.module.css';

type FavoriteButtonProps = {
  /** who the heart is about, for the accessible name */
  name: string;
  favorite: boolean;
  onToggle: () => void;
};

/** The heart: one click adds a favorite, one click takes it away */
export default function FavoriteButton({ name, favorite, onToggle }: FavoriteButtonProps) {
  const label = favorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`;

  return (
    <button
      type="button"
      className={favorite ? `${styles.heart} ${styles.on}` : styles.heart}
      aria-label={label}
      aria-pressed={favorite}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      onClick={onToggle}
    >
      <HeartIcon filled={favorite} />
    </button>
  );
}
