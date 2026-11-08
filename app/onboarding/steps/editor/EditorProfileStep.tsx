import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { ChipGroup, Field, OrgPicker, Section } from '../../../components';
import shared from '../../onboarding.module.css';
import FormStep from '../FormStep';
import PhotoField from '../../fields/PhotoField';
import ShortBioField from '../../fields/ShortBioField';
import { TOPICS } from '../../constants';
import { fieldError, toggleValue } from '../../helpers';
import { isFreeEmailDomain } from '../../../utils/validation.utils';
import type { EmailAddressResource } from '@clerk/shared/types';
import type {
  OrgOption,
  ProfileData,
  ProfileErrors,
  ProfileTouch,
  ProfileUpdate,
  Touched,
} from '../../../types/onboarding.types';

type EditorProfileStepProps = {
  data: ProfileData;
  orgs: OrgOption[];
  errors: ProfileErrors;
  touched: Touched;
  shake: boolean;
  update: ProfileUpdate;
  touch: ProfileTouch;
  addOrg: (org: OrgOption) => void;
  onBack: () => void;
  onNext: () => void;
  /** Name, email and location belong to the account, so only the first profile step collects them */
  showBasics?: boolean;
};

/** Clerk errors carry the sentence meant for the person, so show that instead of a generic one */
const clerkMessage = (error: unknown, fallback: string) => {
  const first = (error as { errors?: { longMessage?: string; message?: string }[] })?.errors?.[0];
  return first?.longMessage ?? first?.message ?? fallback;
};

/** Editor step 2: who they are and which newsroom they commission for */
export default function EditorProfileStep(p: EditorProfileStepProps) {
  const { data, update, touch } = p;
  const err = fieldError(p.errors, p.touched);
  const { user, isLoaded } = useUser();

  /** One object keeps the four parts of the code flow in step with each other */
  const [flow, setFlow] = useState<{
    busy: 'send' | 'verify' | null;
    sent: boolean;
    notice: string | null;
    error: string | null;
  }>({ busy: null, sent: false, notice: null, error: null });
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<EmailAddressResource | null>(null);
  const settle = (patch: Partial<typeof flow>) => setFlow((current) => ({ ...current, ...patch }));

  const submitted = data.email.trim().toLowerCase();
  /** The same address Clerk already holds, verified or still waiting for its code */
  const known = user?.emailAddresses.find((address) => address.emailAddress.toLowerCase() === submitted);
  /** One flag drives both the field and validation, so they can never disagree */
  const verified = data.businessEmailVerified;

  /** Any edit to the address invalidates the code that was sent to the old one */
  const changeEmail = (value: string) => {
    update('email', value);
    update('businessEmailVerified', false);
    setPending(null);
    setCode('');
    settle({ busy: null, sent: false, notice: null, error: null });
  };

  const sendCode = async () => {
    if (!user) return;

    if (isFreeEmailDomain(data.email)) {
      settle({ error: 'Use your work email address, not a personal inbox.' });
      return;
    }

    settle({ busy: 'send', notice: null, error: null });
    try {
      // an address already on the account (the sign-up email, say) is proven, so skip the code
      const address = known ?? (await user.createEmailAddress({ email: data.email.trim() }));

      if (address.verification?.status === 'verified') {
        update('businessEmailVerified', true);
        settle({ busy: null, notice: 'Work email verified.' });
        return;
      }

      await address.prepareVerification({ strategy: 'email_code' });
      setPending(address);
      settle({ busy: null, sent: true, notice: `We sent a 6-digit code to ${address.emailAddress}.` });
    } catch (error) {
      settle({ busy: null, error: clerkMessage(error, 'Unable to send the code right now.') });
    }
  };

  const verifyCode = async () => {
    if (!pending) return;

    settle({ busy: 'verify', notice: null, error: null });
    try {
      const result = await pending.attemptVerification({ code: code.trim() });

      if (result.verification?.status !== 'verified') {
        settle({ busy: null, error: 'That verification code is not valid.' });
        return;
      }

      update('businessEmailVerified', true);
      setPending(null);
      setCode('');
      settle({ busy: null, sent: false, notice: 'Work email verified.' });
    } catch (error) {
      settle({ busy: null, error: clerkMessage(error, 'That verification code is not valid.') });
    }
  };

  const text = (key: 'firstName' | 'lastName' | 'jobTitle' | 'location', placeholder: string) => (
    <input
      type="text"
      value={data[key]}
      placeholder={placeholder}
      onChange={(e) => update(key, e.target.value)}
      onBlur={() => touch(key)}
    />
  );

  return (
    <FormStep
      role="editor"
      backLabel="← Change role"
      onBack={p.onBack}
      title="Your newsroom"
      lead="Freelancers see this when they're deciding whether to pitch you."
      data={data}
      orgs={p.orgs}
      shake={p.shake}
      submitLabel="Continue →"
      onSubmit={p.onNext}
    >
      {p.showBasics !== false && (
        <Section title="Basics" color="var(--c-green)">
          <PhotoField data={data} update={update} />
          <div className={shared.grid2}>
            <Field label="First name" error={err('firstName')}>
              {text('firstName', 'Sarah')}
            </Field>
            <Field label="Last name" error={err('lastName')}>
              {text('lastName', 'Jenkins')}
            </Field>
            <Field label="Work email" error={err('email')}>
              <input
                type="email"
                value={data.email}
                placeholder="you@newsroom.example"
                onChange={(e) => changeEmail(e.target.value)}
                onBlur={() => touch('email')}
              />
            </Field>
            <Field label="Based in">{text('location', 'Boston, MA')}</Field>
          </div>

          <div className={shared.verify} data-verified={verified}>
            {verified ? (
              <p className={shared.verifyStatus}>
                ✓ Work email verified — this address is linked to your account only.
              </p>
            ) : (
              <>
                <p className={shared.verifyStatus}>
                  We send a one-time code to your work inbox. Each work email can only be used by one account.
                </p>
                <div className={shared.verifyControls}>
                  <button
                    type="button"
                    className={shared.secondaryBtn}
                    onClick={sendCode}
                    disabled={flow.busy === 'send' || !isLoaded || !data.email.trim()}
                  >
                    {flow.busy === 'send' ? 'Sending…' : flow.sent ? 'Send a new code' : 'Send code'}
                  </button>
                  {flow.sent && (
                    <>
                      <div className={shared.verifyCode}>
                        <Field label="Code">
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            aria-label="Verification code"
                            placeholder="123456"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                          />
                        </Field>
                      </div>
                      <button
                        type="button"
                        className={shared.secondaryBtn}
                        onClick={verifyCode}
                        disabled={flow.busy === 'verify' || !code.trim()}
                      >
                        {flow.busy === 'verify' ? 'Verifying…' : 'Verify'}
                      </button>
                    </>
                  )}
                </div>
                {flow.notice && <p className={shared.verifyNotice}>{flow.notice}</p>}
                {flow.error && (
                  <p className={shared.verifyError} role="alert">
                    {flow.error}
                  </p>
                )}
              </>
            )}
          </div>
        </Section>
      )}

      <Section title="Your desk" color="var(--c-blue)">
        <div className={shared.grid2}>
          <Field label="Position / title" error={err('jobTitle')}>
            {text('jobTitle', 'News Editor')}
          </Field>
          <Field label="Years at desk" error={err('yearsAtDesk')}>
            <input
              type="number"
              min={0}
              value={data.yearsAtDesk}
              onChange={(e) => update('yearsAtDesk', e.target.valueAsNumber || 0)}
              onBlur={() => touch('yearsAtDesk')}
            />
          </Field>
        </div>
      </Section>

      <Section title="Organization" hint="Pick your newsroom, or add one that isn't listed." color="var(--c-amber)">
        <OrgPicker
          orgs={p.orgs}
          selected={data.organizationId}
          onSelect={(id) => update('organizationId', id)}
          onAdd={p.addOrg}
        />
      </Section>

      <Section
        title="Desks you staff"
        hint="Freelancers filter by these when they pitch."
        color="var(--c-red)"
        error={err('desks')}
      >
        <ChipGroup
          options={TOPICS}
          selected={data.desks}
          onToggle={(value) => {
            update('desks', toggleValue(data.desks, value));
            touch('desks');
          }}
        />
      </Section>

      <ShortBioField data={data} update={update} placeholder="What kinds of stories are you looking to commission?" />
    </FormStep>
  );
}
