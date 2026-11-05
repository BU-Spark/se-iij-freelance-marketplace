'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { useSignIn } from '@clerk/nextjs/legacy';
import { Field, IIJLogo } from '../components';
import { isValidEmail } from '../utils/validation.utils';
import styles from './login.module.css';

/** What to tell the user when Clerk stops somewhere we cannot finish here */
const UNFINISHED: Record<string, string> = {
  needs_second_factor: 'This account uses two-factor authentication, which is not wired up yet.',
  needs_new_password: 'Your password needs to be reset first. Use “Forgot password?” below.',
  needs_identifier: 'Enter the email address and password for your account.',
  needs_first_factor: 'That sign-in method is not supported here yet. Try again with your password.',
  needs_protect_check: 'We could not verify this request. Please try again.',
};

const messageFor = (status: string | null) =>
  (status ? UNFINISHED[status] : undefined) ?? 'Unable to log in. Please try again.';

type Errors = { email?: string; password?: string; code?: string; form?: string };

function LoginForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  /** Clerk asks for an emailed code when this device is not trusted yet */
  const [verifyingDevice, setVerifyingDevice] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const firstClerkError = (error: unknown): { code?: string; longMessage?: string; message?: string } | undefined =>
    (error as { errors?: Array<{ code?: string; longMessage?: string; message?: string }> } | undefined)?.errors?.[0];

  const startSession = async (sessionId: string | null) => {
    if (!setActive || !sessionId) {
      setErrors({ form: 'We could not start your session. Please try again.' });
      return;
    }

    await setActive({ session: sessionId });
    window.location.assign('/dashboard');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Errors = {};

    if (!email.trim() || !isValidEmail(email)) {
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
        await startSession(result.createdSessionId);
        return;
      }

      // A device Clerk has not seen before has to be verified with a code before the session exists
      if (result.status === 'needs_client_trust') {
        const factor = result.supportedFirstFactors?.find((candidate) => candidate.strategy === 'email_code');
        const emailAddressId = factor && 'emailAddressId' in factor ? factor.emailAddressId : undefined;

        if (!emailAddressId) {
          setErrors({
            form: 'This device needs verifying, but no email code is available. Try a device you have used before.',
          });
          return;
        }

        await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId });
        setVerifyingDevice(true);
        return;
      }

      setErrors({ form: messageFor(result.status) });
    } catch (error) {
      const clerkError = firstClerkError(error);
      setErrors({ form: clerkError?.longMessage ?? clerkError?.message ?? 'Unable to log in. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!code.trim()) {
      setErrors({ code: 'Enter the code from your email.' });
      return;
    }

    if (!isLoaded) return;

    setSubmitting(true);
    setErrors({});
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code: code.trim() });

      if (result.status === 'complete') {
        await startSession(result.createdSessionId);
        return;
      }

      setErrors({ form: messageFor(result.status) });
    } catch (error) {
      const clerkError = firstClerkError(error);
      if (clerkError?.code === 'form_code_incorrect' || clerkError?.code === 'verification_failed') {
        setErrors({ code: 'That code is not valid.' });
      } else {
        setErrors({ form: clerkError?.longMessage ?? clerkError?.message ?? 'Unable to verify this device.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const backToCredentials = () => {
    setVerifyingDevice(false);
    setCode('');
    setErrors({});
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

        {verifyingDevice ? (
          <form className={styles.form} onSubmit={handleVerify} noValidate>
            <p className={styles.trustNote}>
              This device isn&apos;t recognised yet, so we emailed a code to <strong>{email.trim()}</strong>. Enter it
              to finish logging in.
            </p>

            <Field label="Verification code" error={errors.code}>
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                aria-invalid={!!errors.code}
              />
            </Field>
            {errors.form && <p role="alert">{errors.form}</p>}

            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? 'Verifying…' : 'Verify and log in'}
            </button>

            <button type="button" className={styles.switchAccount} onClick={backToCredentials}>
              Use a different account
            </button>
          </form>
        ) : (
          <>
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
                <Link href="/forgot-password">Forgot password?</Link>
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
          </>
        )}
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
