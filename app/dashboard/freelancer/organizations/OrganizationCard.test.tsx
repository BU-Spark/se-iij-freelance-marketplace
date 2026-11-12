import { render, screen } from '@testing-library/react';
import { NAV_ITEMS } from '../../../components/NavMenu/config/navConfig';
import { ORGANIZATIONS } from './constants';
import OrganizationCard from './OrganizationCard';

describe('OrganizationCard', () => {
  const org = ORGANIZATIONS[0];

  it('shows the name, tagline and beats', () => {
    render(<OrganizationCard org={org} />);

    expect(screen.getByRole('heading', { name: org.name })).toBeInTheDocument();
    expect(screen.getByText(org.tagline)).toBeInTheDocument();
    org.beats.forEach((beat) => expect(screen.getByText(beat)).toBeInTheDocument());
  });

  it('shows location, open work and rate', () => {
    render(<OrganizationCard org={org} />);

    expect(screen.getByText(org.city)).toBeInTheDocument();
    expect(screen.getByText(String(org.openAssignments))).toBeInTheDocument();
    expect(screen.getByText(org.rate)).toBeInTheDocument();
  });

  it('is reachable from the freelancer menu', () => {
    expect(NAV_ITEMS.freelancer).toContainEqual(
      expect.objectContaining({ label: 'Organizations', href: '/dashboard/freelancer/organizations' })
    );
  });
});
