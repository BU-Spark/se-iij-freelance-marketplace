import type { ReactNode } from 'react';
import { Source_Serif_4 } from 'next/font/google';
import { requireWorkspace } from '../../../lib/workspace';
import styles from './layout.module.css';

// The freelancer workspace reads in serif throughout; a text serif keeps small copy legible
const text = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
});

/** The freelancer workspace is only for people whose profile has the freelancer role */
export default async function FreelancerLayout({ children }: { children: ReactNode }) {
  await requireWorkspace('freelancer');

  return <div className={`${text.variable} ${styles.serif}`}>{children}</div>;
}
