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

  it('shows the whole list on focus when only listed values are allowed', () => {
    render(<TagInput tags={[]} onChange={jest.fn()} suggestions={SUGGESTIONS} allowCustom={false} />);

    fireEvent.focus(screen.getByRole('combobox'));

    expect(screen.getAllByRole('option')).toHaveLength(SUGGESTIONS.length);
  });

  it('refuses a value outside the list when custom values are off', () => {
    const onChange = jest.fn();
    render(<TagInput tags={[]} onChange={onChange} suggestions={SUGGESTIONS} allowCustom={false} />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'Local government' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
    // the text stays, so they can keep searching
    expect(input).toHaveValue('Local government');
  });

  it('adds the list spelling when the typed text matches only by case', () => {
    const onChange = jest.fn();
    render(<TagInput tags={[]} onChange={onChange} suggestions={SUGGESTIONS} allowCustom={false} />);
    const input = screen.getByRole('combobox');

    fireEvent.change(input, { target: { value: 'health/wellness' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['Health/Wellness']);
  });

  it('keeps a fixed list open after a pick, so the next one can be chosen', () => {
    render(<TagInput tags={[]} onChange={jest.fn()} suggestions={SUGGESTIONS} allowCustom={false} />);
    fireEvent.focus(screen.getByRole('combobox'));

    fireEvent.click(screen.getByRole('option', { name: 'Politics' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('reopens the list when the focused box is clicked again', () => {
    render(<TagInput tags={[]} onChange={jest.fn()} suggestions={SUGGESTIONS} />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Escape' });

    fireEvent.click(input);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
