'use client';

import { useState } from 'react';
import SidePanel from '../SidePanel/SidePanel';
import RoleCard from './cards/RoleCard';
import RoleForm from './forms/RoleForm';
import { ROLE_CONFIG } from './config/roleConfig';
import type { RoleDetails } from '../../types/profile.types';

type RoleDrawerProps = {
  details: RoleDetails;
  onClose: () => void;
  /** if given, the details get an Edit button; resolves true once saved */
  onSave?: (details: RoleDetails) => Promise<boolean> | boolean;
};

export default function RoleDrawer({ details, onClose, onSave }: RoleDrawerProps) {
  const [editing, setEditing] = useState(false);
  const config = ROLE_CONFIG[details.role];

  const save = async (next: RoleDetails) => {
    // a failed save leaves the form open so nothing typed is lost
    if ((await onSave?.(next)) === true) setEditing(false);
  };

  return (
    <SidePanel title={`${config.label} details`} side="right" tone="navy" onClose={onClose}>
      {editing && onSave ? (
        <RoleForm details={details} onSave={save} onCancel={() => setEditing(false)} />
      ) : (
        <RoleCard details={details} onEdit={onSave && (() => setEditing(true))} />
      )}
    </SidePanel>
  );
}
