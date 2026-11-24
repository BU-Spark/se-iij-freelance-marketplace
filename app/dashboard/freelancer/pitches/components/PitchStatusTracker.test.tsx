import { render, screen } from '@testing-library/react';
import PitchStatusTracker, { NEXT_STEP, pitchProgress } from './PitchStatusTracker';
import type { PitchStatus } from '../../../../types/dashboard.types';

const states = (status: PitchStatus) => pitchProgress(status).map((step) => `${step.label}:${step.state}`);

describe('pitchProgress', () => {
  it('starts with only the submission done', () => {
    expect(states('new')).toEqual(['Submitted:current', 'In review:upcoming', 'Decision:upcoming']);
  });

  it('moves to review once the editor reads it', () => {
    expect(states('reviewed')).toEqual(['Submitted:done', 'In review:current', 'Decision:upcoming']);
  });

  it('keeps negotiation inside the review stage', () => {
    expect(states('negotiating')).toEqual(['Submitted:done', 'Negotiating:current', 'Decision:upcoming']);
  });

  it.each(['accepted', 'declined'] as const)('ends on the decision when the pitch is %s', (status) => {
    const steps = pitchProgress(status);
    expect(steps.slice(0, 2).every((step) => step.state === 'done')).toBe(true);
    expect(steps[2]).toEqual({
      label: status === 'accepted' ? 'Accepted' : 'Declined',
      state: 'current',
      tone: status,
    });
  });

  it('only ever moves forward along new → reviewed → negotiating → decided', () => {
    const doneCount = (status: PitchStatus) => pitchProgress(status).filter((step) => step.state === 'done').length;
    const path: PitchStatus[] = ['new', 'reviewed', 'negotiating', 'accepted'];
    const counts = path.map(doneCount);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(doneCount('declined')).toBe(doneCount('accepted'));
  });
});

describe('PitchStatusTracker', () => {
  it('marks the current step and says what happens next', () => {
    render(<PitchStatusTracker status="negotiating" />);

    expect(screen.getByRole('list', { name: 'Pitch progress' })).toBeInTheDocument();
    expect(screen.getByText('Negotiating').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Submitted').closest('li')).not.toHaveAttribute('aria-current');
    expect(screen.getByText(NEXT_STEP.negotiating)).toBeInTheDocument();
  });

  it('shows the final decision in place of the generic step', () => {
    render(<PitchStatusTracker status="declined" />);

    expect(screen.getByText('Declined')).toBeInTheDocument();
    expect(screen.queryByText('Decision')).not.toBeInTheDocument();
  });
});
