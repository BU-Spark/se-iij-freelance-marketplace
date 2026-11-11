import type { ReactNode } from 'react';
import { EditorHeader } from '../header/EditorHeader';
import styles from './FreelancerWorkspace.module.css';

export type FreelancerWorkspaceProps = {
  children: ReactNode;
};

/** Pages that live in a workspace share the header; it opens on the side the URL belongs to */
export function FreelancerWorkspace({ children }: FreelancerWorkspaceProps) {
  return (
    <div className={styles.workspace}>
      <EditorHeader />
      {children}
    </div>
  );
}
