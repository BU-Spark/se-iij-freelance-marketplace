import { fireEvent, render, screen, within } from '@testing-library/react';
import PitchArchive from './PitchArchive';
import { PITCHES } from '../../../../test/fixtures/pitches';

/** The declined pitches, the first one with the notes the editor saved */
const ARCHIVED = PITCHES.filter((p) => p.status === 'declined').map((pitch, index) => ({
  ...pitch,
  feedback:
    index === 0
      ? {
          decision: 'rejected' as const,
          comments: 'Not for this desk.',
          strengths: 'Sharp reporting.',
          improvements: 'Bring a local angle.',
        }
      : null,
}));

const cardFor = (slug: string) => screen.queryByRole('button', { name: new RegExp(slug) });
const decisionPanel = () => screen.getByRole('region', { name: 'Your decision' });

describe('PitchArchive', () => {
  it('lists every declined pitch and opens the first one', () => {
    render(<PitchArchive pitches={ARCHIVED} />);

    expect(screen.getByRole('heading', { name: 'Archive' })).toBeInTheDocument();
    ARCHIVED.forEach((pitch) => expect(cardFor(pitch.slug)).toBeInTheDocument());
    expect(cardFor(ARCHIVED[0].slug)).toHaveAttribute('aria-pressed', 'true');

    const detail = screen.getByRole('region', { name: /archived pitch details/i });
    expect(within(detail).getByText(ARCHIVED[0].slug)).toBeInTheDocument();
  });

  it('links back to the inbox', () => {
    render(<PitchArchive pitches={ARCHIVED} />);
    expect(screen.getByRole('link', { name: /back to inbox/i })).toHaveAttribute('href', '/dashboard/pitches');
  });

  it('shows the decision and the notes saved with the decline', () => {
    render(<PitchArchive pitches={ARCHIVED} />);

    expect(decisionPanel()).toHaveTextContent('Your decision: Declined');
    expect(decisionPanel()).toHaveTextContent('Not for this desk.');
    expect(decisionPanel()).toHaveTextContent('Sharp reporting.');
    expect(decisionPanel()).toHaveTextContent('Bring a local angle.');
  });

  it('opens another declined pitch when it is clicked', () => {
    render(<PitchArchive pitches={ARCHIVED} />);

    fireEvent.click(cardFor(ARCHIVED[1].slug)!);

    expect(cardFor(ARCHIVED[1].slug)).toHaveAttribute('aria-pressed', 'true');
    const detail = screen.getByRole('region', { name: /archived pitch details/i });
    expect(within(detail).getByText(ARCHIVED[1].slug)).toBeInTheDocument();
  });

  it('says so when a decline was saved without notes', () => {
    render(<PitchArchive pitches={[ARCHIVED[1]]} />);

    expect(decisionPanel()).toHaveTextContent('Your decision: Declined');
    expect(decisionPanel()).toHaveTextContent('No notes were saved with this decision.');
  });

  it('says so when nothing has been declined', () => {
    render(<PitchArchive pitches={[]} />);

    expect(screen.getByText('No declined pitches yet.')).toBeInTheDocument();
  });
});
