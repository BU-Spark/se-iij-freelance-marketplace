import { fireEvent, render, screen, within } from '@testing-library/react';
import AssignmentFeedbackForm from './AssignmentFeedbackForm';

describe('AssignmentFeedbackForm', () => {
  it('submits the three ratings and a required comment', () => {
    const onSubmit = jest.fn();
    render(<AssignmentFeedbackForm onSubmit={onSubmit} />);

    const selectRating = (category: string, value: number) => {
      const group = screen.getByRole('group', { name: category });
      fireEvent.click(within(group).getByRole('radio', { name: String(value) }));
    };

    selectRating('Quality', 5);
    selectRating('Communication', 4);
    selectRating('Timeliness', 3);
    fireEvent.change(screen.getByLabelText('Comments'), { target: { value: 'Clear updates and careful reporting.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit feedback' }));

    expect(onSubmit).toHaveBeenCalledWith({
      quality: 5,
      communication: 4,
      timeliness: 3,
      comments: 'Clear updates and careful reporting.',
    });
  });

  it('shows the latest feedback from the current session', () => {
    render(
      <AssignmentFeedbackForm
        onSubmit={jest.fn()}
        savedFeedback={{ quality: 5, communication: 4, timeliness: 3, comments: 'Excellent work.' }}
      />
    );

    const latest = screen.getByRole('region', { name: 'Latest assignment feedback' });
    expect(latest).toHaveTextContent('Quality: 5/5');
    expect(latest).toHaveTextContent('Communication: 4/5');
    expect(latest).toHaveTextContent('Timeliness: 3/5');
    expect(latest).toHaveTextContent('Comments: Excellent work.');
  });
});
