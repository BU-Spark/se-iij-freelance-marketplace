import { fireEvent, render, screen } from '@testing-library/react';
import NewAssignmentForm from './NewAssignmentForm';
import { EMPTY_ASSIGNMENT } from '../../utils/assignment.utils';

describe('NewAssignmentForm', () => {
  it('shows every field', () => {
    render(<NewAssignmentForm draft={EMPTY_ASSIGNMENT} onChange={jest.fn()} />);
    ['Title', 'Point of contact', 'Location', 'Length', 'Time', 'Deadline', 'Compensation', 'Description'].forEach(
      (label) => expect(screen.getByLabelText(label)).toBeInTheDocument()
    );
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
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'City council' } });
    expect(onChange).toHaveBeenCalledWith({ title: 'City council' });
  });

  it('does not show the slug', () => {
    render(<NewAssignmentForm draft={{ ...EMPTY_ASSIGNMENT, title: 'City Council Vote!' }} onChange={jest.fn()} />);
    expect(screen.queryByText('Slug')).not.toBeInTheDocument();
    expect(screen.queryByText(/city-council-vote/)).not.toBeInTheDocument();
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
  it('only lets numbers into compensation', () => {
    const onChange = jest.fn();
    render(<NewAssignmentForm draft={EMPTY_ASSIGNMENT} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Compensation'), { target: { value: '$7a50.505' } });
    expect(onChange).toHaveBeenCalledWith({ compensation: '750.50' });
  });

  it('keeps only a whole number of words in length', () => {
    const onChange = jest.fn();
    render(<NewAssignmentForm draft={EMPTY_ASSIGNMENT} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Length'), { target: { value: '1,2a00.5' } });
    expect(onChange).toHaveBeenCalledWith({ length: '12005' });
  });

  it('only lets numbers into time', () => {
    const onChange = jest.fn();
    render(<NewAssignmentForm draft={EMPTY_ASSIGNMENT} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '4.5h' } });
    expect(onChange).toHaveBeenCalledWith({ time: '4.5' });
  });

  it('has no example amount in compensation', () => {
    render(<NewAssignmentForm draft={EMPTY_ASSIGNMENT} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Compensation')).not.toHaveAttribute('placeholder');
  });
});
