import type { Metadata } from 'next';
import OrgAccountForm from './OrgAccountForm';

export const metadata: Metadata = { title: 'Sign up your newsroom · StoryMatch' };

export default function OrganizationSignupPage() {
  return <OrgAccountForm />;
}
