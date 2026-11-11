import { fireEvent, render, screen } from '@testing-library/react';
import TagInput from './TagInput';

const SUGGESTIONS = ['Housing', 'Health/Wellness', 'Politics'];

describe('TagInput', () => {
  it('is a plain text box when there is nothing to suggest', () => {
    render(<TagInput tags={[]} onChange={jest.fn()} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('only offers the values that match what is typed', () => {
    render(<TagInput tags={[]} onChange={jest.fn()} suggestions={SUGGESTIONS} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'hou' } });

    expect(screen.getByRole('option', { name: 'Housing' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Politics' })).not.toBeInTheDocument();
  });

  it('adds the option that is clicked', () => {
    const onChange = jest.fn();
    render(<TagInput tags={[]} onChange={onChange} suggestions={SUGGESTIONS} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pol' } });
    fireEvent.click(screen.getByRole('option', { name: 'Politics' }));

    expect(onChange).toHaveBeenCalledWith(['Politics']);
  });

  it('adds the highlighted option when Enter is pressed', () => {
    const onChange = jest.fn();
    render(<TagInput tags={[]} onChange={onChange} suggestions={SUGGESTIONS} />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'he' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['Health/Wellness']);
  });

  it('still accepts a value that is not on the list', () => {
    const onChange = jest.fn();
    render(<TagInput tags={[]} onChange={onChange} suggestions={SUGGESTIONS} />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'Local government' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['Local government']);
  });

  it('does not offer a value that is already picked', () => {
    render(<TagInput tags={['Housing']} onChange={jest.fn()} suggestions={SUGGESTIONS} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'hou' } });

    expect(screen.queryByRole('option', { name: 'Housing' })).not.toBeInTheDocument();
  });

  it('closes the list on Escape', () => {
    render(<TagInput tags={[]} onChange={jest.fn()} suggestions={SUGGESTIONS} />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'h' } });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
