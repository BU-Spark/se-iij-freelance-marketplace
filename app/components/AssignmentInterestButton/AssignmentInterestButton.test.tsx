import { fireEvent, render, screen } from '@testing-library/react';
import { AssignmentInterestButton, type AssignmentInterestState } from './index';

const title = 'City council coverage';

it('requests interest without claiming success before the parent confirms it', () => {
  const onExpressInterest = jest.fn();
  render(
    <AssignmentInterestButton
      assignmentTitle={title}
      state={{ status: 'idle' }}
      onExpressInterest={onExpressInterest}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: `I'm interested: ${title}` }));
  expect(onExpressInterest).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Your interest has been recorded.')).not.toBeInTheDocument();
});

it.each<AssignmentInterestState>([{ status: 'submitting' }, { status: 'interested' }])(
  'blocks clicks in $status state',
  (state) => {
    const onExpressInterest = jest.fn();
    render(<AssignmentInterestButton assignmentTitle={title} state={state} onExpressInterest={onExpressInterest} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onExpressInterest).not.toHaveBeenCalled();
    expect(button).toHaveAttribute('aria-busy', String(state.status === 'submitting'));
  }
);

it('announces failure, supports retry, and follows parent-controlled transitions', () => {
  const onExpressInterest = jest.fn();
  const view = render(
    <AssignmentInterestButton
      assignmentTitle={title}
      state={{ status: 'error', message: 'Connection lost.' }}
      onExpressInterest={onExpressInterest}
    />
  );
  const retry = screen.getByRole('button', { name: `Retry expressing interest: ${title}` });
  expect(screen.getByRole('alert')).toHaveTextContent('Connection lost.');
  expect(retry).toHaveAccessibleDescription('Connection lost.');
  fireEvent.click(retry);
  expect(onExpressInterest).toHaveBeenCalledTimes(1);
  view.rerender(
    <AssignmentInterestButton
      assignmentTitle={title}
      state={{ status: 'submitting' }}
      onExpressInterest={onExpressInterest}
    />
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Please wait.');
  view.rerender(
    <AssignmentInterestButton
      assignmentTitle={title}
      state={{ status: 'interested' }}
      onExpressInterest={onExpressInterest}
    />
  );
  expect(screen.getByRole('status')).toHaveTextContent('Your interest has been recorded.');
});

it('honors external restrictions and provides a fallback error message', () => {
  const onExpressInterest = jest.fn();
  render(
    <AssignmentInterestButton
      assignmentTitle={title}
      state={{ status: 'error', message: ' ' }}
      onExpressInterest={onExpressInterest}
      disabled
    />
  );
  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to express interest.');
});

it('gives each task its own accessible error description', () => {
  render(
    <>
      <AssignmentInterestButton
        assignmentTitle="First task"
        state={{ status: 'error', message: 'First error' }}
        onExpressInterest={jest.fn()}
      />
      <AssignmentInterestButton
        assignmentTitle="Second task"
        state={{ status: 'error', message: 'Second error' }}
        onExpressInterest={jest.fn()}
      />
    </>
  );
  const first = screen.getByRole('button', { name: /First task/ });
  const second = screen.getByRole('button', { name: /Second task/ });
  expect(first).toHaveAccessibleDescription('First error');
  expect(second).toHaveAccessibleDescription('Second error');
  expect(first.getAttribute('aria-describedby')).not.toBe(second.getAttribute('aria-describedby'));
});
