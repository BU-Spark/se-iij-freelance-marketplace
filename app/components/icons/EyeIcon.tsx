import type { SVGProps } from 'react';

type EyeIconProps = SVGProps<SVGSVGElement> & {
  /** Draws the strike-through state used once the password is revealed. */
  revealed?: boolean;
};

export function EyeIcon({ revealed = false, width = 20, height = 20, ...props }: EyeIconProps) {
  return (
    <svg
      {...props}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3.2" />
      {revealed && <path d="M4 4l16 16" />}
    </svg>
  );
}
