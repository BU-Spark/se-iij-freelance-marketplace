import type { ReactNode } from 'react';
import { PreviewCard } from '../../components';
import shared from '../onboarding.module.css';
import type { OnboardingRole, OrgOption, ProfileData } from '../../types/onboarding.types';

type FormStepProps = {
  role: OnboardingRole;
  backLabel: string;
  onBack: () => void;
  /** profile steps go back to the role picker; preferences steps just step back */
  onBackToRoles?: () => void;
  title: string;
  lead: string;
  data: ProfileData;
  orgs: OrgOption[];
  shake: boolean;
  submitLabel: string;
  onSubmit: () => void;
  /** Only the final step waits on the network */
  submitting?: boolean;
  submitError?: string | null;
  children: ReactNode;
};

/** Shared layout for the profile and preferences steps: form column + live preview + actions */
export default function FormStep(p: FormStepProps) {
  return (
    <div className={`${shared.layout} ${shared.fadeIn}`}>
      <section>
        <button className={shared.back} onClick={p.onBackToRoles ?? p.onBack}>
          {p.backLabel}
        </button>
        <p className={shared.roleTag} data-role={p.role}>
          {p.role === 'editor' ? 'Editor' : 'Freelancer'}
        </p>
        <h1 className={shared.h1}>{p.title}</h1>
        <p className={shared.lead}>{p.lead}</p>

        {p.children}

        <div className={`${shared.actions} ${p.shake ? shared.shake : ''}`}>
          <button className={shared.secondaryBtn} onClick={p.onBack}>
            Back
          </button>
          <button className={shared.primaryBtn} onClick={p.onSubmit} disabled={p.submitting}>
            {p.submitting ? <span className={shared.spinner} /> : p.submitLabel}
          </button>
        </div>
        {p.submitError && <p role="alert">{p.submitError}</p>}
      </section>

      <aside className={shared.previewCol}>
        <p className={shared.previewLabel}>Live preview</p>
        <PreviewCard role={p.role} data={p.data} org={p.orgs.find((o) => o.id === p.data.organizationId)} />
      </aside>
    </div>
  );
}
