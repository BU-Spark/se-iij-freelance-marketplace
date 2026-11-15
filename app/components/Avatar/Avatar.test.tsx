import { fireEvent, render, screen } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('shows initials and no dot by default', () => {
    render(<Avatar name="Sarah Jenkins" />);

    expect(screen.getByText('SJ')).toBeInTheDocument();
    expect(screen.queryByTestId('available-dot')).not.toBeInTheDocument();
  });

  it('shows the uploaded photo in place of the initials', () => {
    const { container } = render(<Avatar name="Sarah Jenkins" src="https://signed.example/photo.jpg" />);

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://signed.example/photo.jpg');
    expect(screen.queryByText('SJ')).not.toBeInTheDocument();
  });

  it('falls back to the initials when the photo will not load', () => {
    const { container } = render(<Avatar name="Sarah Jenkins" src="https://signed.example/expired.jpg" />);

    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(screen.getByText('SJ')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
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
