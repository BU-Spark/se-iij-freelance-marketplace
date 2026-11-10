import type { ReactNode } from 'react';
import { EditorHeader } from '../header/EditorHeader';
import styles from './FreelancerWorkspace.module.css';

export type FreelancerWorkspaceProps = { children: ReactNode };

/** Freelancer pages share the editor's header, opened on the freelancer side */
export function FreelancerWorkspace({ children }: FreelancerWorkspaceProps) {
  return (
    <div className={styles.workspace}>
      <EditorHeader initialRole="freelancer" />
      {children}
    </div>
  );
}
