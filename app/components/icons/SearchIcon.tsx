import type { SVGProps } from 'react';

export function SearchIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} className={className} aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7.5" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}
