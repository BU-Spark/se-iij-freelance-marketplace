import { fireEvent, render, screen, within } from '@testing-library/react';
import OrganizationTeam from './OrganizationTeam';
import type { OrganizationMember } from '../../../lib/organization';

const members: OrganizationMember[] = [
  { id: 'user-1', name: 'Joey Lam', jobTitle: 'News editor', location: 'Boston', desks: ['Politics'] },
  { id: 'user-2', name: 'Sam Desk', jobTitle: 'Desk editor', location: null, desks: [] },
  { id: 'user-3', name: 'Priya Bajaria', jobTitle: 'Local editor', location: 'London', desks: ['Climate'] },
];

const search = () => screen.getByRole('searchbox', { name: /search the team/i });

describe('OrganizationTeam', () => {
  it('lists everyone with their title, city and desks', () => {
    render(<OrganizationTeam members={members} />);

    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list).getByText('Joey Lam')).toBeInTheDocument();
    expect(within(list).getByText('News editor · Boston')).toBeInTheDocument();
    expect(within(list).getByText('Politics')).toBeInTheDocument();
    expect(screen.getByText('3 people')).toBeInTheDocument();
  });

  it('filters by name, desk or city and counts what is left', () => {
    render(<OrganizationTeam members={members} />);

    fireEvent.change(search(), { target: { value: 'climate' } });
    expect(screen.getByText('Priya Bajaria')).toBeInTheDocument();
    expect(screen.queryByText('Joey Lam')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();

    fireEvent.change(search(), { target: { value: 'london' } });
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });

  it('says so when nobody matches', () => {
    render(<OrganizationTeam members={members} />);

    fireEvent.change(search(), { target: { value: 'nobody here' } });

    expect(screen.getByText(/no one matches/i)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('uses the singular for one person', () => {
    render(<OrganizationTeam members={[members[0]]} />);
    expect(screen.getByText('1 person')).toBeInTheDocument();
  });
});
