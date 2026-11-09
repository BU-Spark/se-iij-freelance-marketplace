'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { useSignIn } from '@clerk/nextjs/legacy';
import { Field, IIJLogo, PasswordField } from '../components';
import { MIN_PASSWORD_LENGTH, validatePassword, validatePasswordConfirmation } from '../utils/password.utils';
import { isValidEmail } from '../utils/validation.utils';
import styles from '../login/login.module.css';

type Step = 'email' | 'reset';
type FormErrors = { email?: string; code?: string; password?: string; confirmPassword?: string; form?: string };
type ClerkApiError = { code?: string; longMessage?: string; message?: string };

function ForgotPasswordForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const clearErrors = (...fields: Array<keyof FormErrors>) =>
    setErrors((current) => {
      if (!fields.some((field) => current[field])) return current;
      const next = { ...current };
      fields.forEach((field) => delete next[field]);
      return next;
    });

  const firstClerkError = (error: unknown): ClerkApiError | undefined =>
    (error as { errors?: ClerkApiError[] } | undefined)?.errors?.[0];

  /** Step 1: ask Clerk to email a reset code to the address on file */
  const sendResetCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed || !isValidEmail(trimmed)) {
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }
    if (!isLoaded) return;

    setSubmitting(true);
    setErrors({});
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: trimmed });
      setStep('reset');
    } catch (error) {
      const clerkError = firstClerkError(error);
      if (clerkError?.code === 'form_identifier_not_found') {
        setErrors({ email: 'No account found with that email.' });
      } else {
        setErrors({
          form: clerkError?.longMessage ?? clerkError?.message ?? 'Unable to send a reset code. Please try again.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** Step 2: trade the emailed code + a new password for a session */
  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};

    if (!code.trim()) nextErrors.code = 'Enter the code from your email.';
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
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: code.trim(),
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        window.location.assign('/dashboard');
        return;
      }

      // e.g. a second factor is still required — finish from the login page
      window.location.assign('/login');
    } catch (error) {
      const clerkError = firstClerkError(error);
      if (clerkError?.code === 'form_code_incorrect' || clerkError?.code === 'verification_failed') {
        setErrors({ code: 'That code is not valid.' });
      } else {
        setErrors({
          form: clerkError?.longMessage ?? clerkError?.message ?? 'Unable to reset your password. Please try again.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const backToEmail = () => {
    setStep('email');
    setCode('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  return (
    <main className={styles.main}>
      <div className={styles.colorBand} aria-hidden="true" />
      <section className={styles.panel} aria-labelledby="forgot-password-title">
        <Link href="/" className={styles.brand} aria-label="StoryMatch home">
          <IIJLogo size={92} />
        </Link>

        <p className={styles.eyebrow}>Account help</p>
        <h1 id="forgot-password-title">{step === 'email' ? 'Reset your password' : 'Check your email'}</h1>
        <p className={styles.intro}>
          {step === 'email'
            ? "Enter the email you signed up with and we'll send you a reset code."
            : `We sent a reset code to ${email}. Enter it below with a new password.`}
        </p>

        {step === 'email' ? (
          <form className={styles.form} onSubmit={sendResetCode} noValidate>
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearErrors('email', 'form');
                }}
                aria-invalid={!!errors.email}
              />
            </Field>
            {errors.form && <p role="alert">{errors.form}</p>}
            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? (
                'Sending…'
              ) : (
                <>
                  Send reset code <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={resetPassword} noValidate>
            <Field label="Reset code" error={errors.code}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  clearErrors('code', 'form');
                }}
                aria-invalid={!!errors.code}
              />
            </Field>
            <PasswordField
              label="New password"
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                clearErrors('password', 'confirmPassword', 'form');
              }}
              error={errors.password}
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              hintMet={password.length >= MIN_PASSWORD_LENGTH}
            />
            <PasswordField
              label="Confirm new password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                clearErrors('confirmPassword', 'form');
              }}
              error={errors.confirmPassword}
            />
            {errors.form && <p role="alert">{errors.form}</p>}
            <button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? (
                'Resetting…'
              ) : (
                <>
                  Reset password <span aria-hidden="true">→</span>
                </>
              )}
            </button>
            <div className={styles.formMeta}>
              <button type="button" className={styles.linkButton} onClick={backToEmail}>
                Use a different email
              </button>
            </div>
          </form>
        )}

        <p className={styles.signupPrompt}>
          Remembered it? <Link href="/login">Back to log in</Link>
        </p>
      </section>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <ClerkProvider>
      <ForgotPasswordForm />
    </ClerkProvider>
  );
}
