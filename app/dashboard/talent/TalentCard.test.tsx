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

const heart = { favorite: false, onToggleFavorite: jest.fn() };

describe('TalentCard', () => {
  it('offers a small flag to report the freelancer', () => {
    render(<TalentCard member={member()} saved={false} onSave={jest.fn()} {...heart} />);
    expect(screen.getByRole('button', { name: 'Report Sarah Jenkins' })).toBeInTheDocument();
  });

  it('starts collapsed and opens into the full profile', () => {
    render(<TalentCard member={member()} saved={false} onSave={jest.fn()} {...heart} />);

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
        saved={false}
        onSave={jest.fn()}
        {...heart}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'View profile' }));
    expect(screen.getByText(/hasn.t added more to their profile yet/i)).toBeInTheDocument();
  });

  it('saves, and shows Saved once done', () => {
    const onSave = jest.fn();
    const { rerender } = render(<TalentCard member={member()} saved={false} onSave={onSave} {...heart} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save Sarah Jenkins to your roster' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }));

    rerender(<TalentCard member={member()} saved onSave={onSave} {...heart} />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save sarah/i })).not.toBeInTheDocument();
  });

  it('leaves the heart empty for a saved person until it is clicked', () => {
    const onToggleFavorite = jest.fn();
    render(
      <TalentCard member={member()} saved onSave={jest.fn()} favorite={false} onToggleFavorite={onToggleFavorite} />
    );

    const button = screen.getByRole('button', { name: 'Add Sarah Jenkins to favorites' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(button);
    expect(onToggleFavorite).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }));
  });
});
