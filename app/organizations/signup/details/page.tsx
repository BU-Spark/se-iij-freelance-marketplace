import type { Metadata } from 'next';
import OrgDetailsForm from './OrgDetailsForm';

export const metadata: Metadata = { title: 'Create your organization page · StoryMatch' };

export default function OrganizationDetailsPage() {
  return <OrgDetailsForm />;
}
