'use client';

import { useSearchParams } from 'next/navigation';
import NewAssignmentDrawer from './NewAssignmentDrawer';
import type { RosterMember } from '../../types/dashboard.types';

type NewAssignmentFromUrlProps = {
  closeHref: string;
  roster: RosterMember[];
};

/** Shows the New Assignment drawer only when the URL has ?new=assignment */
export default function NewAssignmentFromUrl({ closeHref, roster }: NewAssignmentFromUrlProps) {
  const params = useSearchParams();
  if (params.get('new') !== 'assignment') return null;
  return <NewAssignmentDrawer closeHref={closeHref} roster={roster} />;
}
