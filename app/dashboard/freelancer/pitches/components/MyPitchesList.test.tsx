import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyPitchesList, { pitchFilterOptions } from './MyPitchesList';
import type { Pitch, PitchStatus } from '../../../../types/dashboard.types';

const pitch = (id: string, status: PitchStatus): Pitch => ({
  id,
  slug: `${id}-story`,
  category: 'Reporting/Writing',
  tags: [],
  freelancer: { id: 'priya', name: 'Priya Shah' },
  submittedAt: new Date(),
  status,
  summary: `Summary of ${id}`,
  location: 'Remote',
  length: '',
  deadline: '',
  rate: '',
  description: '',
});

const pitches = [
  pitch('budget', 'new'),
  pitch('transit', 'negotiating'),
  pitch('fair', 'accepted'),
  pitch('ai', 'new'),
];

const shownIds = () =>
  screen.getAllByRole('link', { name: /View pitch and feedback/ }).map((link) => link.getAttribute('href'));

describe('pitchFilterOptions', () => {
  it('counts each status and leaves out the ones with no pitches', () => {
    expect(pitchFilterOptions(pitches).map((option) => option.label)).toEqual([
      'All (4)',
      'New (2)',
      'Negotiating (1)',
      'Accepted (1)',
    ]);
  });
});

describe('MyPitchesList', () => {
  it('shows every pitch until a status is picked', async () => {
    render(<MyPitchesList pitches={pitches} />);
    expect(shownIds()).toHaveLength(4);

    await userEvent.click(screen.getByRole('button', { name: 'New (2)' }));

    expect(shownIds()).toEqual(['/dashboard/freelancer/pitches/budget', '/dashboard/freelancer/pitches/ai']);
    expect(screen.getByRole('button', { name: 'New (2)' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls out pitches waiting on the freelancer and jumps to them', async () => {
    render(<MyPitchesList pitches={pitches} />);
    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent('1 pitch needs your reply');

    await userEvent.click(within(notice).getByRole('button', { name: 'Show it' }));

    expect(shownIds()).toEqual(['/dashboard/freelancer/pitches/transit']);
  });

  it('has no call-out when nothing is in negotiation', () => {
    render(<MyPitchesList pitches={[pitch('budget', 'new')]} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
