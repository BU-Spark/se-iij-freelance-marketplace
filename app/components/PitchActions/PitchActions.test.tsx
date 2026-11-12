import { fireEvent, render, screen } from '@testing-library/react';
import PitchActions from './PitchActions';

describe('PitchActions', () => {
  it('shows structured decision and feedback fields', () => {
    render(<PitchActions status="new" freelancerName="Marcus Thorne" onSubmitFeedback={jest.fn()} />);
    ['Decision', 'Comments', 'Strengths', 'Improvements'].forEach((label) =>
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    );
  });

  it('submits structured feedback and reports the resulting status', () => {
    const onSubmitFeedback = jest.fn();
    render(<PitchActions status="new" freelancerName="Marcus Thorne" onSubmitFeedback={onSubmitFeedback} />);
    fireEvent.change(screen.getByLabelText('Decision'), { target: { value: 'accepted' } });
    fireEvent.change(screen.getByLabelText('Comments'), { target: { value: 'Strong fit.' } });
    fireEvent.change(screen.getByLabelText('Strengths'), { target: { value: 'Clear angle.' } });
    fireEvent.change(screen.getByLabelText('Improvements'), { target: { value: 'Add a source.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));
    expect(onSubmitFeedback).toHaveBeenCalledWith({
      decision: 'accepted',
      comments: 'Strong fit.',
      strengths: 'Clear angle.',
      improvements: 'Add a source.',
    });
    expect(screen.getByRole('status')).toHaveTextContent('Current pitch status: Accepted');
  });

  it.each([
    ['rejected', 'Rejected'],
    ['revision_requested', 'Revision requested'],
  ] as const)('reports the %s decision as %s', (decision, expectedLabel) => {
    render(<PitchActions status="new" freelancerName="Marcus Thorne" onSubmitFeedback={jest.fn()} />);
    fireEvent.change(screen.getByLabelText('Decision'), { target: { value: decision } });
    fireEvent.change(screen.getByLabelText('Comments'), { target: { value: 'Please see the notes.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));
    expect(screen.getByRole('status')).toHaveTextContent(`Current pitch status: ${expectedLabel}`);
  });
});
