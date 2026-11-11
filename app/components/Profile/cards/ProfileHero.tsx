import Avatar from '../../Avatar/Avatar';
import type { BasicInfo } from '../../../types/profile.types';
import styles from '../Profile.module.css';

type ProfileHeroProps = {
  basic: BasicInfo;
};

export default function ProfileHero({ basic }: ProfileHeroProps) {
  const name = `${basic.firstName} ${basic.lastName}`.trim();

  return (
    <div className={styles.hero}>
      <span className={styles.heroPhoto}>
        {basic.photoUrl ? (
          <img src={basic.photoUrl} alt="" className={styles.photo} />
        ) : (
          <Avatar name={name} size={84} available={basic.availableNow} />
        )}
      </span>
      <p className={styles.heroName}>{name || 'Your name'}</p>
    </div>
  );
}
