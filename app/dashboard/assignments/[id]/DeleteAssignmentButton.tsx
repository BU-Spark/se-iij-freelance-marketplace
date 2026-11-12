'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '../../../components/Modal/Modal';
import { useToast } from '../../../components/Toast/ToastProvider';
import styles from './assignmentDetail.module.css';

type DeleteAssignmentButtonProps = {
  assignmentId: string;
  /** called once the server has deleted it, e.g. to close the drawer */
  onDeleted?: () => void;
};

/**
 * Deleting is permanent, so the button only opens a confirmation first. The row is removed on the
 * server, then the page is refreshed, so the card cannot linger on screen looking undeleted.
 */
export default function DeleteAssignmentButton({ assignmentId, onDeleted }: DeleteAssignmentButtonProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('delete failed');

      setConfirming(false);
      showToast('Assignment deleted.', 'success');
      router.refresh();
      onDeleted?.();
    } catch {
      // stay on the confirmation so the editor can try again
      showToast('Could not delete this assignment. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button type="button" className={styles.deleteButton} onClick={() => setConfirming(true)}>
        Delete
      </button>

      {confirming && (
        <Modal
          title="Delete this assignment?"
          subtitle="It comes off every desk at once, and people who signalled interest lose the post too."
          onClose={() => {
            if (!deleting) setConfirming(false);
          }}
          footer={
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setConfirming(false)}
                disabled={deleting}
              >
                Keep it
              </button>
              <button type="button" className={styles.danger} onClick={remove} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete assignment'}
              </button>
            </div>
          }
        >
          <p className={styles.confirmText}>This cannot be undone.</p>
        </Modal>
      )}
    </>
  );
}
