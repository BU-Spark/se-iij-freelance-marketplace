import OrganizationCard, { type OrgCardDetails } from '../../dashboard/freelancer/organizations/OrganizationCard';
import type { OrgDetails } from './orgSignup';

/** Blank answers show a placeholder, so the card keeps its shape while the form is being filled in */
const toCard = (data: OrgDetails): OrgCardDetails => ({
  name: data.name.trim() || 'Your organization',
  tagline: data.tagline.trim() || 'Your tagline appears here',
  reach: data.reach,
  beats: data.beats,
  city: data.city.trim() || '—',
  rate: data.rate.trim() || '—',
  openAssignments: 0,
});

/** The card freelancers will find on their Organizations page */
export default function OrgPagePreview({ data }: { data: OrgDetails }) {
  return (
    <section aria-label="Preview of your organization card">
      <OrganizationCard org={toCard(data)} />
    </section>
  );
}
