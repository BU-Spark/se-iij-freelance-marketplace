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

  it('says whether its opportunities are local, US only or global', () => {
    const { rerender } = render(<OrganizationCard org={{ ...org, reach: 'local' }} />);
    expect(screen.getByText('Local')).toBeInTheDocument();

    rerender(<OrganizationCard org={{ ...org, reach: 'us' }} />);
    expect(screen.getByText('US only')).toBeInTheDocument();

    rerender(<OrganizationCard org={{ ...org, reach: 'global' }} />);
    expect(screen.getByText('Global')).toBeInTheDocument();
  });

  it('is reachable from the freelancer menu', () => {
    expect(NAV_ITEMS.freelancer).toContainEqual(
      expect.objectContaining({ label: 'Organizations', href: '/dashboard/freelancer/organizations' })
    );
  });
});
