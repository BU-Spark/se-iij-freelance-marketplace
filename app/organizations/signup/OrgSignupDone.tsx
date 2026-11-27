import type { OrgDetails } from './orgSignup';
import OrgPagePreview from './OrgPagePreview';
import auth from '../../login/login.module.css';
import styles from './organizationSignup.module.css';

type OrgSignupDoneProps = {
  data: OrgDetails;
  onEdit: () => void;
};

/** Shown once the form passes; says plainly that nothing is stored until a backend exists */
export default function OrgSignupDone({ data, onEdit }: OrgSignupDoneProps) {
  return (
    <div className={styles.done}>
      <p role="status" className={auth.intro}>
        Here is how {data.name.trim()} will appear to freelancers. Signing up newsrooms is not switched on yet, so no
        account or page has been saved.
      </p>
      <OrgPagePreview data={data} />
      <button type="button" className={auth.submit} onClick={onEdit}>
        Edit details
      </button>
    </div>
  );
}
