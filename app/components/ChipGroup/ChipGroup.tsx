import styles from './ChipGroup.module.css';
import { CHIP_COLORS } from '../../onboarding/constants';
type ChipGroupProps = {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
};

export default function ChipGroup({ options, selected, onToggle }: ChipGroupProps) {
  return (
    <div className={styles.chips}>
      {options.map((o, i) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            className={styles.chip}
            data-active={active}
            aria-pressed={active}
            style={{ ['--accent' as string]: CHIP_COLORS[i % CHIP_COLORS.length] }}
            onClick={() => onToggle(o)}
          >
            <span className={styles.chipMark}>{active ? '✓' : '+'}</span>
            {o}
          </button>
        );
      })}
    </div>
  );
}
