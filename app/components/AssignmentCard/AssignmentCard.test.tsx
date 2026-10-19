import { render, screen } from '@testing-library/react';
import AssignmentCard from './AssignmentCard';
import type { DeskAssignment } from '../../types/dashboard.types';

const election: DeskAssignment = {
  id: 'election',
  title: 'Election Night Live Coverage: District 4',
  category: 'Reporting/Writing',
  type: 'Reporting',
  urgent: true,
  status: 'open',
  contact: { name: 'Sarah Jenkins', desk: 'News Desk' },
  deadline: new Date(2030, 0, 1, 23, 0),
  location: 'Central City Hall',
  length: '~6 hours',
  rate: { amount: 1.1, unit: 'word', estimate: 1100 },
  interestedIds: ['marcus', 'amara', 'satoshi'],
};

describe('AssignmentCard', () => {
  it('shows the title, contact and pills', () => {
    render(<AssignmentCard assignment={election} />);
    expect(screen.getByRole('heading', { name: /election night/i })).toBeInTheDocument();
    expect(screen.getByText(/sarah jenkins, news desk/i)).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('shows the details box', () => {
    render(<AssignmentCard assignment={election} />);
    expect(screen.getByText('Central City Hall')).toBeInTheDocument();
    expect(screen.getByText('~6 hours')).toBeInTheDocument();
    expect(screen.getByText(/\$1\.10 \/ word/)).toBeInTheDocument();
  });

  it('shows how many people are interested', () => {
    render(<AssignmentCard assignment={election} />);
    expect(screen.getByText('3 interested')).toBeInTheDocument();
  });

  it('says when nobody is interested yet', () => {
    render(<AssignmentCard assignment={{ ...election, urgent: false, interestedIds: [] }} />);
    expect(screen.getByText('No one interested yet')).toBeInTheDocument();
    expect(screen.queryByText('Urgent')).not.toBeInTheDocument();
  });
});
