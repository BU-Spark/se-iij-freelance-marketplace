'use client';

import { useSearchParams } from 'next/navigation';
import NewAssignmentDrawer from './NewAssignmentDrawer';

type NewAssignmentFromUrlProps = {
  closeHref: string;
};

/** Shows the New Assignment drawer only when the URL has ?new=assignment */
export default function NewAssignmentFromUrl({ closeHref }: NewAssignmentFromUrlProps) {
  const params = useSearchParams();
  if (params.get('new') !== 'assignment') return null;
  return <NewAssignmentDrawer closeHref={closeHref} />;
}
