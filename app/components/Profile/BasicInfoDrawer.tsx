'use client';

import { useState } from 'react';
import SidePanel from '../SidePanel/SidePanel';
import BasicInfoCard from './cards/BasicInfoCard';
import BasicInfoForm from './forms/BasicInfoForm';
import type { BasicInfo } from '../../types/profile.types';

type BasicInfoDrawerProps = {
  basic: BasicInfo;
  onClose: () => void;
  /** if given, the details get an Edit button; resolves true once saved */
  onSave?: (basic: BasicInfo) => Promise<boolean> | boolean;
};

export default function BasicInfoDrawer({ basic, onClose, onSave }: BasicInfoDrawerProps) {
  const [editing, setEditing] = useState(false);

  const save = async (next: BasicInfo) => {
    // a failed save leaves the form open so nothing typed is lost
    if ((await onSave?.(next)) === true) setEditing(false);
  };

  return (
    <SidePanel title="Basic info" side="right" tone="navy" onClose={onClose}>
      {editing && onSave ? (
        <BasicInfoForm basic={basic} onSave={save} onCancel={() => setEditing(false)} />
      ) : (
        <BasicInfoCard basic={basic} onEdit={onSave && (() => setEditing(true))} />
      )}
    </SidePanel>
  );
}
