'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

/** how long a toast stays on screen */
export const TOAST_DURATION = 4000;

const ICON: Record<ToastType, string> = { success: '✓', error: '!', info: 'i' };

const ToastContext = createContext<ToastContextValue | null>(null);

/** Wrap the app once; then any component inside can call useToast() */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, message, type }]);
      // remove it automatically after a few seconds
      setTimeout(() => dismiss(id), TOAST_DURATION);
    },
    [dismiss]
  );

  // same object every render, so components using it don't re-render for nothing
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* aria-live: screen readers read out each new toast */}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            <span className={styles.icon} aria-hidden="true">
              {ICON[t.type]}
            </span>
            <p className={styles.message}>{t.message}</p>
            <button
              type="button"
              className={styles.close}
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// used when a component is rendered without the provider (e.g. in some tests): do nothing
const NO_OP: ToastContextValue = { showToast: () => {} };

/** const { showToast } = useToast(); showToast('Saved'); */
export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? NO_OP;
}
