import { render, screen } from '@testing-library/react';
import PitchFeedbackCard from './PitchFeedbackCard';
import type { PitchFeedback } from '../../../../types/dashboard.types';

const feedback = (overrides: Partial<PitchFeedback> = {}): PitchFeedback => ({
  decision: 'accepted',
  comments: 'Strong idea for the housing desk.',
  strengths: 'Named sources already lined up.',
  improvements: '',
  ...overrides,
});

describe('PitchFeedbackCard', () => {
  it('says so when the editor has not replied yet', () => {
    render(<PitchFeedbackCard feedback={null} />);
    expect(screen.getByText('No feedback has been shared on this pitch yet.')).toBeInTheDocument();
  });

  it('shows the decision, the date and each filled-in part under its own heading', () => {
    render(<PitchFeedbackCard feedback={feedback()} feedbackAt={new Date(2030, 2, 4)} />);

    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Shared Mar 4, 2030')).toBeInTheDocument();
    expect(screen.getByText("Editor's comments").nextSibling).toHaveTextContent('Strong idea for the housing desk.');
    expect(screen.getByText('What worked').nextSibling).toHaveTextContent('Named sources already lined up.');
    // improvements was left blank, so its heading is left out
    expect(screen.queryByText('What to improve')).not.toBeInTheDocument();
  });

  it('offers a way back to the composer when the editor asks for a revision', () => {
    render(
      <PitchFeedbackCard feedback={feedback({ decision: 'revision_requested', improvements: 'Tighten the angle.' })} />
    );

    expect(screen.getByText('Revision requested')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Revise and pitch again →' })).toHaveAttribute(
      'href',
      '/dashboard/freelancer/make-a-pitch'
    );
  });

  it('does not offer a revision link for a final decision', () => {
    render(<PitchFeedbackCard feedback={feedback({ decision: 'rejected' })} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('notes when the editor decided without writing anything', () => {
    render(<PitchFeedbackCard feedback={feedback({ comments: '', strengths: ' ', improvements: '' })} />);
    expect(screen.getByText('The editor did not add any notes.')).toBeInTheDocument();
  });
});
