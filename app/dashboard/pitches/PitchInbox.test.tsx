import { fireEvent, render, screen, within } from '@testing-library/react';
import PitchInbox from './PitchInbox';
import { PITCHES } from './constants';

const newCount = PITCHES.filter((p) => p.status === 'new').length;
const cardFor = (slug: string) => screen.queryByRole('button', { name: new RegExp(slug) });
const tab = (name: string) =>
  within(screen.getByRole('group', { name: /filter pitches/i })).getByRole('button', { name });

describe('PitchInbox', () => {
  beforeEach(() => {
    render(<PitchInbox pitches={PITCHES} />);
  });

  it('lists every pitch with the counts', () => {
    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByText(`${PITCHES.length} pitches`)).toBeInTheDocument();
    expect(screen.getByText(`${newCount} new`)).toBeInTheDocument();
    PITCHES.forEach((p) => expect(cardFor(p.slug)).toBeInTheDocument());
  });

  it('opens the first pitch by default', () => {
    expect(cardFor(PITCHES[0].slug)).toHaveAttribute('aria-pressed', 'true');
    const detail = screen.getByRole('region', { name: /pitch details/i });
    expect(within(detail).getByText(PITCHES[0].slug)).toBeInTheDocument();
  });

  it('opens a pitch when it is clicked', () => {
    const second = PITCHES[1];
    fireEvent.click(cardFor(second.slug)!);
    expect(cardFor(second.slug)).toHaveAttribute('aria-pressed', 'true');
    const detail = screen.getByRole('region', { name: /pitch details/i });
    expect(within(detail).getByText(second.slug)).toBeInTheDocument();
  });

  it('accepting a pitch updates the list, the panel and the new count', () => {
    // the first pitch is new and open by default
    fireEvent.click(screen.getByRole('button', { name: 'Accept pitch' }));
    expect(screen.getByRole('button', { name: 'Accepted ✓' })).toBeDisabled();
    expect(screen.getByText(`${newCount - 1} new`)).toBeInTheDocument();
    expect(within(cardFor(PITCHES[0].slug)!).getByText('Accepted')).toBeInTheDocument();
  });

  it('shows only the pitches for the chosen tab', () => {
    fireEvent.click(tab('Declined'));
    expect(tab('Declined')).toHaveAttribute('aria-pressed', 'true');
    PITCHES.forEach((p) => {
      if (p.status === 'declined') expect(cardFor(p.slug)).toBeInTheDocument();
      else expect(cardFor(p.slug)).not.toBeInTheDocument();
    });
  });

  it('says so when a tab has no pitches', () => {
    fireEvent.click(tab('Negotiating'));
    expect(screen.getByText('No negotiating pitches.')).toBeInTheDocument();
  });
});
