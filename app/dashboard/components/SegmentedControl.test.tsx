import { fireEvent, render, screen } from '@testing-library/react';
import SegmentedControl from './SegmentedControl';

const OPTIONS = [
  { value: 'day', label: 'day' },
  { value: 'week', label: 'week' },
  { value: 'month', label: 'month' },
];

describe('SegmentedControl', () => {
  it('renders a labelled group with only the current value pressed', () => {
    render(<SegmentedControl label="Range" options={OPTIONS} value="week" />);
    expect(screen.getByRole('group', { name: 'Range' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'week' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'day' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'month' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with the clicked value', () => {
    const onChange = jest.fn();
    render(<SegmentedControl label="Range" options={OPTIONS} value="day" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'month' }));
    expect(onChange).toHaveBeenCalledWith('month');
  });
});
