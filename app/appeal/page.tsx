'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Field, IIJLogo } from '../components';
import { isValidEmail } from '../utils/validation.utils';
import styles from './appeal.module.css';

type Errors = { email?: string; message?: string; form?: string };

/**
 * The way back in for a suspended person. A Clerk ban stops them signing in, so this has to work
 * without a session: they give the email on their account and say why they think it was wrong.
 */
export default function AppealPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Errors = {};

    if (!email.trim() || !isValidEmail(email)) {
      nextErrors.email = 'Enter the email address on your account.';
    }

    if (!message.trim()) {
      nextErrors.message = 'Tell the team why the suspension should be looked at again.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const response = await fetch('/api/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrors({ form: body?.error ?? 'Could not send your appeal. Please try again.' });
        return;
      }

      setSent(true);
    } catch (error) {
      console.error('Could not send the appeal.', error);
      setErrors({ form: 'Could not send your appeal. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.colorBand} aria-hidden="true" />
      <section className={styles.panel} aria-labelledby="appeal-title">
        <Link href="/" className={styles.brand} aria-label="StoryMatch home">
          <IIJLogo size={92} />
        </Link>

        <p className={styles.eyebrow}>Account suspension</p>
        <h1 id="appeal-title">Appeal this decision</h1>

        {sent ? (
          <>
            <p className={styles.intro}>
              Thanks — your appeal is with the Story Match team. They will look at the account again and reply to{' '}
              <strong>{email.trim()}</strong>.
            </p>
            <p className={styles.sentNote}>You do not need to send it twice.</p>
            <Link href="/login" className={styles.secondary}>
              Back to log in
            </Link>
          </>
        ) : (
          <>
            <p className={styles.intro}>
              If you think your account was suspended by mistake, tell us why. The team reads every appeal before making
              a final decision.
            </p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <Field label="Email on your account" error={errors.email}>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={!!errors.email}
                />
              </Field>

              <Field label="Why should we look again?" error={errors.message}>
                <textarea
                  name="message"
                  rows={6}
                  placeholder="Tell us what happened, and anything we should check."
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  aria-invalid={!!errors.message}
                />
              </Field>

              {errors.form && <p role="alert">{errors.form}</p>}

              <button type="submit" className={styles.submit} disabled={submitting}>
                {submitting ? 'Sending…' : 'Send appeal'}
              </button>
            </form>

            <p className={styles.backPrompt}>
              Already had your account restored? <Link href="/login">Log in</Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
