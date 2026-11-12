import { fireEvent, render, screen, within } from '@testing-library/react';
import PitchActions from './PitchActions';

const renderActions = () => {
  const onSubmitFeedback = jest.fn();
  render(<PitchActions status="new" freelancerName="Marcus Thorne" onSubmitFeedback={onSubmitFeedback} />);
  return onSubmitFeedback;
};

const action = (name: RegExp) =>
  within(screen.getByRole('group', { name: 'Pitch decision' })).getByRole('button', { name });

describe('PitchActions', () => {
  it('starts on the decision step with negotiate, accept and decline', () => {
    renderActions();
    expect(action(/^Negotiate/)).toBeInTheDocument();
    expect(action(/^Accept/)).toBeInTheDocument();
    expect(action(/^Decline/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Comments')).not.toBeInTheDocument();
  });

  it('reveals the comments, strengths and improvements fields once an action is chosen', () => {
    renderActions();
    fireEvent.click(action(/^Accept/));
    ['Comments', 'Strengths', 'Improvements'].forEach((label) =>
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    );
  });

  it('sends the chosen decision with the notes', () => {
    const onSubmitFeedback = renderActions();
    fireEvent.click(action(/^Accept/));
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
    ['Negotiate', 'revision_requested', 'Negotiating'],
    ['Decline', 'rejected', 'Declined'],
  ] as const)('%s opens the notes step and submits as %s', (label, decision, resulting) => {
    const onSubmitFeedback = renderActions();
    fireEvent.click(action(new RegExp(`^${label}`)));
    fireEvent.change(screen.getByLabelText('Comments'), { target: { value: 'Please see the notes.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));
    expect(onSubmitFeedback).toHaveBeenCalledWith({
      decision,
      comments: 'Please see the notes.',
      strengths: '',
      improvements: '',
    });
    expect(screen.getByRole('status')).toHaveTextContent(`Current pitch status: ${resulting}`);
  });

  it('returns to the decision step when the action is changed', () => {
    renderActions();
    fireEvent.click(action(/^Decline/));
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    expect(screen.getByRole('group', { name: 'Pitch decision' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Comments')).not.toBeInTheDocument();
  });

  it('opens the notes step prefilled with feedback already saved', () => {
    render(
      <PitchActions
        status="negotiating"
        freelancerName="Marcus Thorne"
        savedFeedback={{
          decision: 'revision_requested',
          comments: 'Tighten the lede.',
          strengths: 'Great sources.',
          improvements: 'Add a comment from the council.',
        }}
        onSubmitFeedback={jest.fn()}
      />
    );
    expect(screen.queryByRole('group', { name: 'Pitch decision' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Comments')).toHaveValue('Tighten the lede.');
    expect(screen.getByText(/Current status:/)).toHaveTextContent('Negotiating');
    expect(screen.getByRole('region', { name: 'Latest pitch feedback' })).toHaveTextContent('Tighten the lede.');
  });
});
