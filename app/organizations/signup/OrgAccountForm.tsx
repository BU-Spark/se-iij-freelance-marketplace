'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Field, PasswordField } from '../../components';
import { DETAILS_PATH, EMPTY_ACCOUNT, type OrgAccount } from './orgSignup';
import OrgSignupShell from './OrgSignupShell';
import auth from '../../login/login.module.css';

/** Step 1 of registering a newsroom. Nothing is sent anywhere until there is a backend for it */
export default function OrgAccountForm() {
  const router = useRouter();
  const [account, setAccount] = useState<OrgAccount>(EMPTY_ACCOUNT);
  const update = (key: keyof OrgAccount, value: string) => setAccount((current) => ({ ...current, [key]: value }));

  /** Props shared by the two plain text inputs */
  const bind = (key: 'contactName' | 'email') => ({
    name: key,
    value: account[key],
    onChange: (event: { target: { value: string } }) => update(key, event.target.value),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    router.push(DETAILS_PATH);
  };

  return (
    <OrgSignupShell
      eyebrow="Step 1 of 2"
      title="Sign up your newsroom"
      intro="Start with your login. Next you will build the page freelancers see."
    >
      <form className={auth.form} onSubmit={submit} noValidate>
        <Field label="Your name">
          <input type="text" autoComplete="name" {...bind('contactName')} />
        </Field>
        <Field label="Work email">
          <input type="email" autoComplete="email" placeholder="you@yournewsroom.com" {...bind('email')} />
        </Field>
        <PasswordField
          label="Password"
          name="password"
          value={account.password}
          onChange={(value) => update('password', value)}
        />
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          value={account.confirmPassword}
          onChange={(value) => update('confirmPassword', value)}
        />

        <button type="submit" className={auth.submit}>
          Continue <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className={auth.signupPrompt}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </OrgSignupShell>
  );
}
