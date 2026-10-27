import { fireEvent, render, screen } from '@testing-library/react';
import NewAssignmentForm from './NewAssignmentForm';
import { EMPTY_ASSIGNMENT } from '../../utils/assignment.utils';

describe('NewAssignmentForm', () => {
  it('shows every field', () => {
    render(<NewAssignmentForm draft={EMPTY_ASSIGNMENT} onChange={jest.fn()} />);
    [
      'Title',
      'Slug',
      'Point of contact',
      'Location',
      'Length / time',
      'Deadline',
      'Compensation',
      'Description',
    ].forEach((label) => expect(screen.getByLabelText(label)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /editing/i })).toBeInTheDocument();
  });

  it('reports the project type that was picked', () => {
    const onChange = jest.fn();
    render(<NewAssignmentForm draft={EMPTY_ASSIGNMENT} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /editing/i }));
    expect(onChange).toHaveBeenCalledWith({ category: 'Editing' });
  });

  it('reports typing in a field', () => {
    const onChange = jest.fn();
    render(<NewAssignmentForm draft={EMPTY_ASSIGNMENT} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'city-council' } });
    expect(onChange).toHaveBeenCalledWith({ slug: 'city-council' });
  });

  it('shows validation errors next to their fields', () => {
    render(
      <NewAssignmentForm
        draft={EMPTY_ASSIGNMENT}
        onChange={jest.fn()}
        errors={{ title: 'Give the assignment a title.', category: 'Pick a project type.' }}
      />
    );
    expect(screen.getByText('Give the assignment a title.')).toBeInTheDocument();
    expect(screen.getByText('Pick a project type.')).toBeInTheDocument();
  });
});
