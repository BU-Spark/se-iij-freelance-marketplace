import type { ReactNode } from 'react';
import type { ProfileRole } from '../../types';
import { EditorHeader } from '../header/EditorHeader';
import styles from './FreelancerWorkspace.module.css';

export type FreelancerWorkspaceProps = {
  children: ReactNode;
  /** which side of the desk this page belongs to; the header opens on that side */
  role?: ProfileRole;
};

/** Pages that live in a workspace share the header, opened on that workspace's side */
export function FreelancerWorkspace({ children, role = 'freelancer' }: FreelancerWorkspaceProps) {
  return (
    <div className={styles.workspace}>
      <EditorHeader initialRole={role} />
      {children}
    </div>
  );
}
