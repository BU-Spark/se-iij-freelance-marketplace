'use client';

import { useId } from 'react';
import styles from './IIJLogo.module.css';

/**
 * SVG version of the StoryMatch logo: navy ring, circular text, rainbow fan.
 * The wedges animate in one by one and spin slightly on hover.
 */

type Props = {
  size?: number;
  animated?: boolean;
  showText?: boolean;
  className?: string;
};

// Angle 0° = 3 o'clock, increasing clockwise (SVG coordinates)
const WEDGES = [
  { angle: 50, color: '#D58BF0', len: 50 },
  { angle: 70, color: '#A33BDB', len: 42 },
  { angle: 90, color: '#EC4899', len: 46 },
  { angle: 110, color: '#E5395B', len: 52 },
  { angle: 130, color: '#EF6C2B', len: 44 },
  { angle: 150, color: '#F59E2B', len: 50 },
  { angle: 170, color: '#F5C842', len: 46 },
  { angle: 190, color: '#F5C842', len: 38 },
  { angle: 210, color: '#4CBB47', len: 50 },
  { angle: 230, color: '#3E9B3A', len: 42 },
  { angle: 250, color: '#2E7D32', len: 52 },
  { angle: 270, color: '#4FA3E0', len: 44 },
  { angle: 290, color: '#2563EB', len: 50 },
  { angle: 310, color: '#1B3A6B', len: 54 },
  { angle: 330, color: '#7C6FD6', len: 40 },
];

const C = 100; // center
const toPoint = (r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return `${(C + r * Math.cos(rad)).toFixed(2)},${(C + r * Math.sin(rad)).toFixed(2)}`;
};

function wedgePoints(angle: number, len: number) {
  const inner = 14;
  return [
    toPoint(inner, angle - 2.5),
    toPoint(len, angle - 8),
    toPoint(len, angle + 8),
    toPoint(inner, angle + 2.5),
  ].join(' ');
}

export default function IIJLogo({ size = 160, animated = true, showText = true, className = '' }: Props) {
  const id = useId().replace(/:/g, '');
  const topPath = `top-${id}`;
  const bottomPath = `bottom-${id}`;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="StoryMatch logo"
      className={`${styles.logo} ${animated ? styles.animated : ''} ${className}`}
    >
      <defs>
        {/* Top arc, clockwise through 12 o'clock */}
        <path id={topPath} d="M 26.7 73.3 A 78 78 0 0 1 173.3 73.3" fill="none" />
        {/* Bottom arc, counter-clockwise through 6 o'clock (keeps text upright) */}
        <path id={bottomPath} d="M 19.18 70.59 A 86 86 0 1 0 180.82 70.59" fill="none" />
      </defs>

      <circle cx="100" cy="100" r="96" fill="#fff" stroke="var(--navy)" strokeWidth="3.5" />

      <g className={styles.fan}>
        {WEDGES.map((w, i) => (
          <polygon
            key={w.angle}
            points={wedgePoints(w.angle, w.len)}
            fill={w.color}
            className={styles.wedge}
            style={{ animationDelay: `${i * 45}ms` }}
          />
        ))}
      </g>

      {showText && (
        <g className={styles.text}>
          <text>
            <textPath href={`#${topPath}`} startOffset="50%" textAnchor="middle">
              STORY
            </textPath>
          </text>
          <text>
            <textPath href={`#${bottomPath}`} startOffset="50%" textAnchor="middle">
              MATCH
            </textPath>
          </text>
        </g>
      )}
    </svg>
  );
}
