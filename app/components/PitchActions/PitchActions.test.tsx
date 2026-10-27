import { fireEvent, render, screen } from '@testing-library/react';
import PitchActions from './PitchActions';

describe('PitchActions', () => {
  it('explains what accepting does for a new pitch', () => {
    render(<PitchActions status="new" freelancerName="Marcus Thorne" onChange={jest.fn()} />);
    expect(screen.getByText(/turns this pitch into an assignment for Marcus Thorne/)).toBeInTheDocument();
  });

  it('reports which button was clicked', () => {
    const onChange = jest.fn();
    render(<PitchActions status="new" freelancerName="Marcus Thorne" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Accept pitch' }));
    expect(onChange).toHaveBeenCalledWith('accepted');
    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
    expect(onChange).toHaveBeenCalledWith('declined');
    fireEvent.click(screen.getByRole('button', { name: 'Negotiate' }));
    expect(onChange).toHaveBeenCalledWith('negotiating');
  });

  it('shows "Accepted ✓" and disables it once accepted', () => {
    render(<PitchActions status="accepted" freelancerName="Marcus Thorne" onChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Accepted ✓' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decline' })).toBeEnabled();
  });
});
