'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { SearchBox } from '../../components/search/SearchBox';
import { useToast } from '../../components/Toast/ToastProvider';
import type { AccountStatus, AdminAccount } from '../../types/admin.types';
import styles from '../admin.module.css';

const STATUS_LABELS: Record<AccountStatus, string> = { active: 'Active', suspended: 'Suspended' };
const ROLE_LABELS: Record<AdminAccount['role'], string> = { freelancer: 'Freelancer', editor: 'Editor' };

const joined = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

/** Ask the admin API to suspend or reactivate one account; the server bans in Clerk as well */
const saveStatus = async (account: AdminAccount, status: AccountStatus, reason: string) => {
  const response = await fetch(`/api/admin/accounts/${account.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(status === 'suspended' ? { status, reason } : { status }),
  });

  const body = (await response.json().catch(() => null)) as { account?: AdminAccount; error?: string } | null;

  if (!response.ok) {
    throw new Error(body?.error ?? 'Unable to update this account right now.');
  }

  return body?.account ?? null;
};

/** Find people, suspend them with a reason, and reactivate them at any time */
export default function AccountList({ accounts }: { accounts: AdminAccount[] }) {
  const [filter, setFilter] = useState<AccountStatus>('active');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState(accounts);
  // the account whose "Suspend" form is open, the reason typed so far, and the account being saved
  const [suspending, setSuspending] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const { showToast } = useToast();

  const q = query.trim().toLowerCase();
  const matches = items.filter((a) => !q || `${a.name} ${a.email}`.toLowerCase().includes(q));
  const shown = matches.filter((a) => a.status === filter);

  const setStatus = async (account: AdminAccount, status: AccountStatus) => {
    setBusy(account.id);

    try {
      const updated = await saveStatus(account, status, reason.trim());
      if (!updated) {
        showToast('Unable to update this account right now.', 'error');
        return;
      }

      setItems((list) => list.map((a) => (a.id === account.id ? updated : a)));
      setSuspending(null);
      showToast(
        status === 'suspended'
          ? `${account.name} is suspended. You can reactivate them under Suspended.`
          : `${account.name} is active again.`,
        status === 'suspended' ? 'info' : 'success'
      );
    } catch (error) {
      console.error('Could not change the account status.', error);
      showToast(error instanceof Error ? error.message : 'Unable to update this account right now.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section>
      <div className={styles.toolbar}>
        <div role="group" aria-label="Account status" className={styles.filters}>
          {(['active', 'suspended'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={s === filter}
              className={styles.filter}
              onClick={() => setFilter(s)}
            >
              {STATUS_LABELS[s]}
              <span className={styles.count}>{matches.filter((a) => a.status === s).length}</span>
            </button>
          ))}
        </div>
        <SearchBox
          className={styles.search}
          aria-label="Search accounts"
          placeholder="Search by name or email"
          shortcut=""
          compact
          value={query}
          onChange={setQuery}
        />
      </div>

      {shown.length === 0 ? (
        <p className={styles.emptyCard}>
          <strong>No accounts found</strong>
          {q ? 'Try a different name or email.' : `No ${filter} accounts right now.`}
        </p>
      ) : (
        <ul className={styles.list}>
          {shown.map((account) => (
            <li key={account.id} className={clsx(styles.row, styles[account.status])}>
              <div className={styles.rowTop}>
                <div>
                  <h2 className={styles.rowTitle}>{account.name}</h2>
                  <p className={styles.meta}>
                    {ROLE_LABELS[account.role]} · {account.email}
                  </p>
                </div>
                <span className={clsx(styles.status, styles[account.status])}>{STATUS_LABELS[account.status]}</span>
              </div>

              {account.suspensionReason && (
                <p className={styles.reason}>
                  <span className={styles.reasonLabel}>Why they were suspended</span>
                  {account.suspensionReason}
                </p>
              )}

              {suspending === account.id ? (
                <form
                  className={styles.suspendForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    void setStatus(account, 'suspended');
                  }}
                >
                  <label htmlFor={`reason-${account.id}`}>Why are you suspending {account.name}?</label>
                  <textarea id={`reason-${account.id}`} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <div className={styles.actions}>
                    <button type="button" className={styles.action} onClick={() => setSuspending(null)}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={clsx(styles.action, styles.dangerAction)}
                      disabled={!reason.trim() || busy === account.id}
                    >
                      Suspend account
                    </button>
                  </div>
                </form>
              ) : (
                <div className={clsx(styles.rowFooter, styles.spaced)}>
                  <p className={styles.meta}>Joined {joined(account.joinedAt)}</p>
                  <div className={styles.actions} role="group" aria-label={`Actions for ${account.name}`}>
                    {account.status === 'active' ? (
                      <button
                        type="button"
                        className={styles.action}
                        disabled={busy === account.id}
                        onClick={() => {
                          setSuspending(account.id);
                          setReason('');
                        }}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={clsx(styles.action, styles.primaryAction)}
                        disabled={busy === account.id}
                        onClick={() => void setStatus(account, 'active')}
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
