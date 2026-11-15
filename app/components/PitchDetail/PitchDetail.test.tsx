import { render, screen } from '@testing-library/react';
import PitchDetail from './PitchDetail';
import { PITCHES } from '../../../test/fixtures/pitches';
import { pitchHeading } from '../../utils/pitch.utils';

const pitch = PITCHES[0]; // shadow-budget-city-hall

describe('PitchDetail', () => {
  beforeEach(() => {
    render(<PitchDetail pitch={pitch} />);
  });

  it('shows the title, tags and who sent it', () => {
    expect(screen.getByRole('heading', { name: pitchHeading(pitch.slug) })).toBeInTheDocument();
    expect(screen.getByText(pitch.category)).toBeInTheDocument();
    pitch.tags.forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
    expect(screen.getByText(pitch.freelancer.name)).toBeInTheDocument();
    expect(screen.getByText(/^Submitted /)).toBeInTheDocument();
  });

  it('shows the summary and the four quick facts', () => {
    expect(screen.getByText(pitch.summary)).toBeInTheDocument();
    ['Deadline', 'Location', 'Length', 'Compensation'].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument()
    );
    expect(screen.getByText(pitch.rate)).toBeInTheDocument();
  });

  it('shows the description instead of the old per-question answers', () => {
    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument();
    expect(screen.getByText(pitch.description)).toBeInTheDocument();
    ['Potential sources', 'Audience', 'Assets'].forEach((label) =>
      expect(screen.queryByText(label)).not.toBeInTheDocument()
    );
  });
});
