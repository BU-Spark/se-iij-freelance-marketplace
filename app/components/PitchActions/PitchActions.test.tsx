import { fireEvent, render, screen } from '@testing-library/react';
import PitchActions from './PitchActions';

describe('PitchActions', () => {
  it('shows structured decision and feedback fields', () => {
    render(
      <PitchActions status="new" freelancerName="Marcus Thorne" onChange={jest.fn()} onSubmitFeedback={jest.fn()} />
    );
    ['Decision', 'Comments', 'Strengths', 'Improvements'].forEach((label) =>
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    );
  });

  it('submits structured feedback and updates the pitch status', () => {
    const onChange = jest.fn();
    const onSubmitFeedback = jest.fn();
    render(
      <PitchActions
        status="new"
        freelancerName="Marcus Thorne"
        onChange={onChange}
        onSubmitFeedback={onSubmitFeedback}
      />
    );
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
    expect(onChange).toHaveBeenCalledWith('accepted');
    expect(screen.getByRole('status')).toHaveTextContent('Current pitch status: Accepted');
  });

  it.each([
    ['rejected', 'declined'],
    ['revision_requested', 'reviewed'],
  ] as const)('maps the %s feedback decision to %s', (decision, expectedStatus) => {
    const onChange = jest.fn();
    render(
      <PitchActions status="new" freelancerName="Marcus Thorne" onChange={onChange} onSubmitFeedback={jest.fn()} />
    );
    fireEvent.change(screen.getByLabelText('Decision'), { target: { value: decision } });
    fireEvent.change(screen.getByLabelText('Comments'), { target: { value: 'Please see the notes.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));
    expect(onChange).toHaveBeenCalledWith(expectedStatus);
  });
});
