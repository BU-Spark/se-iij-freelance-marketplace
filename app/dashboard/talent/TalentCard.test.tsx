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
  it('starts collapsed and opens into the full profile', () => {
    render(<TalentCard member={member()} invited={false} onInvite={jest.fn()} />);

    const toggle = screen.getByRole('button', { name: 'View profile' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Local politics reporter.')).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(screen.getByRole('button', { name: 'Hide profile' })).toHaveAttribute('aria-expanded', 'true');
    const profile = screen.getByRole('region', { name: "Sarah Jenkins's profile" });
    expect(profile).toHaveTextContent('Local politics reporter.');
    expect(profile).toHaveTextContent('Ten years covering Leeds council.');
    expect(profile).toHaveTextContent('West Yorkshire');
    expect(profile).toHaveTextContent('£300/day');
    expect(profile).toHaveTextContent('Housing');
    expect(profile).toHaveTextContent('Audio');
    expect(profile).toHaveTextContent('Datawrapper');

    const clip = screen.getByRole('link', { name: /council budget explainer/i });
    expect(clip).toHaveAttribute('href', 'https://example.com/budget');
    expect(clip).toHaveAttribute('target', '_blank');
    expect(clip).toHaveAttribute('rel', 'noopener noreferrer');

    fireEvent.click(screen.getByRole('button', { name: 'Hide profile' }));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('says so when there is nothing more to show', () => {
    render(
      <TalentCard
        member={member({
          beats: [],
          city: '',
          mediums: [],
          profile: { shortBio: '', longBio: '', communityCovered: '', rate: '', tools: [], portfolio: [] },
        })}
        invited={false}
        onInvite={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'View profile' }));
    expect(screen.getByText(/hasn.t added more to their profile yet/i)).toBeInTheDocument();
  });

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
