import { render, screen } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('shows initials and no dot by default', () => {
    render(<Avatar name="Sarah Jenkins" />);

    expect(screen.getByText('SJ')).toBeInTheDocument();
    expect(screen.queryByTestId('available-dot')).not.toBeInTheDocument();
  });

  it('adds the green dot when the person is free right now', () => {
    render(<Avatar name="Sarah Jenkins" available />);

    expect(screen.getByTestId('available-dot')).toBeInTheDocument();
  });

  it('leaves the dot off when the flag is false', () => {
    render(<Avatar name="Sarah Jenkins" available={false} />);

    expect(screen.queryByTestId('available-dot')).not.toBeInTheDocument();
  });
});
