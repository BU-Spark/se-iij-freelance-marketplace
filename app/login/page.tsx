'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Field, IIJLogo } from '../components';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Enter your password.';
    }

    setErrors(nextErrors);
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

          <div className={styles.formMeta}>
            <label className={styles.remember}>
              <input type="checkbox" name="remember" />
              <span>Remember me</span>
            </label>
            <a href="mailto:support@iij.example?subject=Password%20reset">Forgot password?</a>
          </div>

          <button type="submit" className={styles.submit}>
            Log in <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className={styles.signupPrompt}>
          New to IIJ? <Link href="/onboarding">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
