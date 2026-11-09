import { Field } from '../../components';
import shared from '../onboarding.module.css';
import { fieldError } from '../helpers';
import type { ProfileData, ProfileErrors, ProfileTouch, ProfileUpdate, Touched } from '../../types/onboarding.types';

type AgeStepProps = {
  data: ProfileData;
  errors: ProfileErrors;
  touched: Touched;
  shake: boolean;
  update: ProfileUpdate;
  touch: ProfileTouch;
  onBack: () => void;
  onNext: () => void;
};

/** Step 2: the 18+ gate. The date of birth stays in the browser and is never submitted. */
export default function AgeStep(p: AgeStepProps) {
  const err = fieldError(p.errors, p.touched);

  return (
    <section className={`${shared.narrow} ${shared.fadeIn}`}>
      <h1 className={shared.h1}>First, your age</h1>
      <p className={shared.lead}>
        The desk is for working journalists, so you need to be 18 or older. Your date of birth is only used to check
        that — it is never saved.
      </p>

      <div className={shared.ageForm}>
        <Field label="Date of birth" error={err('dateOfBirth')}>
          <input
            type="date"
            autoComplete="bday"
            value={p.data.dateOfBirth}
            onChange={(event) => p.update('dateOfBirth', event.target.value)}
            onBlur={() => p.touch('dateOfBirth')}
          />
        </Field>
      </div>

      <div className={`${shared.actions} ${p.shake ? shared.shake : ''}`}>
        <button className={shared.secondaryBtn} onClick={p.onBack}>
          Back
        </button>
        <button className={shared.primaryBtn} onClick={p.onNext}>
          Continue →
        </button>
      </div>
    </section>
  );
}
