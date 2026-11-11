import { fireEvent, render, screen } from '@testing-library/react';
import TalentCard from './TalentCard';
import type { TalentMember } from '../../types/talent.types';

const member = (overrides: Partial<TalentMember> = {}): TalentMember => ({
  id: 'user-1',
  name: 'Sarah Jenkins',
  specialty: 'Politics',
  beats: ['Politics', 'Housing'],
  city: 'Leeds, UK',
  status: 'available',
  openHours: [{ start: 9, end: 17 }],
  note: 'Available 09:00–17:00 today',
  weekDays: [true, true, true, true, true, false, false],
  monthDays: Array(30).fill(true),
  mediums: ['Text', 'Audio'],
  availableNow: true,
  profile: {
    shortBio: 'Local politics reporter.',
    longBio: 'Ten years covering Leeds council.',
    communityCovered: 'West Yorkshire',
    rate: '£300/day',
    tools: ['Datawrapper'],
    portfolio: [{ title: 'Council budget explainer', url: 'https://example.com/budget', type: 'article' }],
  },
  ...overrides,
});

describe('TalentCard', () => {
  it('invites, and shows Invited once done', () => {
    const onInvite = jest.fn();
    const { rerender } = render(<TalentCard member={member()} invited={false} onInvite={onInvite} />);

    fireEvent.click(screen.getByRole('button', { name: 'Invite Sarah Jenkins to your roster' }));
    expect(onInvite).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }));

    rerender(<TalentCard member={member()} invited onInvite={onInvite} />);
    expect(screen.getByText('Invited')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /invite sarah/i })).not.toBeInTheDocument();
  });
});
