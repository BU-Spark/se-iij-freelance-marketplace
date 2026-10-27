import { render, screen } from '@testing-library/react';
import PitchDetail from './PitchDetail';
import { PITCHES } from '../../dashboard/pitches/constants';

const pitch = PITCHES[0]; // shadow-budget-city-hall

describe('PitchDetail', () => {
  beforeEach(() => {
    render(<PitchDetail pitch={pitch} />);
  });

  it('shows the title, tags and who sent it', () => {
    expect(screen.getByRole('heading', { name: pitch.slug })).toBeInTheDocument();
    expect(screen.getByText(pitch.category)).toBeInTheDocument();
    pitch.tags.forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
    expect(screen.getByText(pitch.freelancer.name)).toBeInTheDocument();
    expect(screen.getByText(/^Submitted /)).toBeInTheDocument();
  });

  it('shows the summary and the four quick facts', () => {
    expect(screen.getByText(pitch.summary)).toBeInTheDocument();
    ['Location', 'Length', 'Deadline', 'Rate'].forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
    expect(screen.getByText(pitch.rate)).toBeInTheDocument();
  });

  it('shows every longer answer', () => {
    [pitch.sources, pitch.audience, pitch.assets, pitch.whyFit, pitch.whyMe].forEach((text) =>
      expect(screen.getByText(text)).toBeInTheDocument()
    );
  });
});
