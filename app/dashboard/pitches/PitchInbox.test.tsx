import { fireEvent, render, screen, within } from '@testing-library/react';
import PitchInbox from './PitchInbox';
import { PITCHES } from './constants';

describe('PitchInbox', () => {
  beforeEach(() => {
    render(<PitchInbox pitches={PITCHES} />);
  });

  it('lists every pitch with the counts', () => {
    expect(screen.getByRole('heading', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByText(`3 new · ${PITCHES.length} total`)).toBeInTheDocument();
    PITCHES.forEach((p) => {
      expect(screen.getByRole('button', { name: new RegExp(p.slug) })).toBeInTheDocument();
    });
  });

  it('opens the first pitch by default', () => {
    expect(screen.getByRole('button', { name: new RegExp(PITCHES[0].slug) })).toHaveAttribute('aria-pressed', 'true');
    const detail = screen.getByRole('region', { name: /pitch details/i });
    expect(within(detail).getByText(PITCHES[0].slug)).toBeInTheDocument();
  });

  it('opens a pitch when it is clicked', () => {
    const second = PITCHES[1];
    fireEvent.click(screen.getByRole('button', { name: new RegExp(second.slug) }));
    expect(screen.getByRole('button', { name: new RegExp(second.slug) })).toHaveAttribute('aria-pressed', 'true');
    const detail = screen.getByRole('region', { name: /pitch details/i });
    expect(within(detail).getByText(second.slug)).toBeInTheDocument();
  });

  it('accepting a pitch updates the list, the panel and the new count', () => {
    // the first pitch is new and open by default
    fireEvent.click(screen.getByRole('button', { name: 'Accept pitch' }));
    expect(screen.getByRole('button', { name: 'Accepted ✓' })).toBeDisabled();
    expect(screen.getByText(`2 new · ${PITCHES.length} total`)).toBeInTheDocument();
    const firstCard = screen.getByRole('button', { name: new RegExp(PITCHES[0].slug) });
    expect(within(firstCard).getByText('Accepted')).toBeInTheDocument();
  });
});
