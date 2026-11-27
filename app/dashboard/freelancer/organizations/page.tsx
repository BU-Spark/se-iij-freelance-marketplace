import rosterStyles from '../../roster/roster.module.css';
import { ORGANIZATIONS } from './constants';
import OrganizationGrid from './OrganizationGrid';

export default function OrganizationsPage() {
  return (
    <div className={rosterStyles.shell}>
      <main className={rosterStyles.main}>
        <header className={rosterStyles.heading}>
          <div>
            <p className={rosterStyles.eyebrow}>Freelancer workspace</p>
            <h1 className={rosterStyles.title}>Organizations</h1>
            <p className={rosterStyles.description}>
              Newsrooms on the desk, what they cover, what they pay and whether their work is local, US only or global.
            </p>
          </div>
        </header>

        <OrganizationGrid orgs={ORGANIZATIONS} />
      </main>
    </div>
  );
}
