'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { useSignUp } from '@clerk/nextjs/legacy';
import { Field, IIJLogo, PasswordField } from '../components';
import { MIN_PASSWORD_LENGTH, validatePassword, validatePasswordConfirmation } from '../utils/password.utils';
import { isValidEmail } from '../utils/validation.utils';
import styles from '../login/login.module.css';

type FormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
  code?: string;
};

function SignupForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const clearErrors = (...fields: Array<keyof FormErrors>) =>
    setErrors((current) => {
      if (!fields.some((field) => current[field])) return current;
      const next = { ...current };
      fields.forEach((field) => delete next[field]);
      return next;
    });

  const submitSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!email.trim() || !isValidEmail(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    const passwordError = validatePassword(password);
    if (passwordError) nextErrors.password = passwordError;

    const confirmationError = validatePasswordConfirmation(password, confirmPassword);
    if (confirmationError) nextErrors.confirmPassword = confirmationError;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!isLoaded) return;

    setSubmitting(true);
    setErrors({});
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setVerificationPending(true);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'errors' in error
          ? (error.errors as Array<{ longMessage?: string; message?: string }>)[0]
          : undefined;
      setErrors({
        form: message?.longMessage ?? message?.message ?? 'Unable to create your account. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const verifyEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoaded) return;
    setSubmitting(true);
    setErrors({});
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        window.location.assign('/onboarding');
      }
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'errors' in error
          ? (error.errors as Array<{ longMessage?: string; message?: string }>)[0]
          : undefined;
      setErrors({ code: message?.longMessage ?? message?.message ?? 'That verification code is not valid.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.colorBand} aria-hidden="true" />
      <section className={styles.panel} aria-labelledby="signup-title">
        <Link href="/" className={styles.brand} aria-label="Institute for Independent Journalists home">
          <IIJLogo size={92} />
        </Link>
        <p className={styles.eyebrow}>Join the desk</p>
        <h1 id="signup-title">{verificationPending ? 'Check your email' : 'Create your IIJ account'}</h1>
        <p className={styles.intro}>
          {verificationPending
            ? `We sent a verification code to ${email}.`
            : 'Create an account, then build your editor or freelancer profile.'}
        </p>

        {verificationPending ? (
          <form className={styles.form} onSubmit={verifyEmail} noValidate>
            <Field label="Verification code" error={errors.code}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                aria-invalid={!!errors.code}
              />
            </Field>
            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? (
                'Verifying…'
              ) : (
                <>
                  Verify email <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={submitSignup} noValidate>
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <PasswordField
              label="Password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(next) => {
                setPassword(next);
                clearErrors('password', 'confirmPassword', 'form');
              }}
              error={errors.password}
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              hintMet={password.length >= MIN_PASSWORD_LENGTH}
            />
            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(next) => {
                setConfirmPassword(next);
                clearErrors('confirmPassword', 'form');
              }}
              error={errors.confirmPassword}
            />
            {errors.form && <p role="alert">{errors.form}</p>}
            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? (
                'Creating account…'
              ) : (
                <>
                  Create account <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>
        )}

        <p className={styles.signupPrompt}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default function SignupPage() {
  return (
    <ClerkProvider>
      <SignupForm />
    </ClerkProvider>
  );
}
