'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { useSignIn } from '@clerk/nextjs';
import { Field, IIJLogo } from '../components';
import styles from './login.module.css';

function LoginForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Enter your password.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!isLoaded) return;

    setSubmitting(true);
    setErrors({});
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        window.location.assign('/dashboard');
      }
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'errors' in error
          ? (error.errors as Array<{ longMessage?: string; message?: string }>)[0]
          : undefined;
      setErrors({ form: message?.longMessage ?? message?.message ?? 'Unable to log in. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.colorBand} aria-hidden="true" />
      <section className={styles.panel} aria-labelledby="login-title">
        <Link href="/" className={styles.brand} aria-label="Institute for Independent Journalists home">
          <IIJLogo size={92} />
        </Link>

        <p className={styles.eyebrow}>Welcome back</p>
        <h1 id="login-title">Log in to IIJ</h1>
        <p className={styles.intro}>Pick up where you left off with your assignments and pitches.</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Field label="Email" error={errors.email}>
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

          <Field label="Password" error={errors.password}>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={!!errors.password}
            />
          </Field>
          {errors.form && <p role="alert">{errors.form}</p>}

          <div className={styles.formMeta}>
            <label className={styles.remember}>
              <input type="checkbox" name="remember" />
              <span>Remember me</span>
            </label>
            <a href="mailto:support@iij.example?subject=Password%20reset">Forgot password?</a>
          </div>

          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? (
              'Logging in…'
            ) : (
              <>
                Log in <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        <p className={styles.signupPrompt}>
          New to IIJ? <Link href="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <ClerkProvider>
      <LoginForm />
    </ClerkProvider>
  );
}
