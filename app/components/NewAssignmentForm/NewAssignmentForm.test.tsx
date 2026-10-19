import { fireEvent, render, screen } from '@testing-library/react';
import NewAssignmentForm from './NewAssignmentForm';
import { EMPTY_DRAFT } from '../NewAssignmentDrawer/constants';

describe('NewAssignmentForm', () => {
  it('shows every field', () => {
    render(<NewAssignmentForm draft={EMPTY_DRAFT} onChange={jest.fn()} />);
    ['Slug', 'Point of contact', 'Location', 'Length / time', 'Deadline', 'Compensation', 'Description'].forEach(
      (label) => expect(screen.getByLabelText(label)).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: /editing/i })).toBeInTheDocument();
  });

  it('reports the project type that was picked', () => {
    const onChange = jest.fn();
    render(<NewAssignmentForm draft={EMPTY_DRAFT} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /editing/i }));
    expect(onChange).toHaveBeenCalledWith({ category: 'Editing' });
  });

  it('reports typing in a field', () => {
    const onChange = jest.fn();
    render(<NewAssignmentForm draft={EMPTY_DRAFT} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Slug'), { target: { value: 'city-council' } });
    expect(onChange).toHaveBeenCalledWith({ slug: 'city-council' });
  });
});
