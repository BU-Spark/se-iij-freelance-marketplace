import { fireEvent, render, screen } from '@testing-library/react';
import NewAssignmentDrawer from './NewAssignmentDrawer';

// The drawer uses Next's router to close itself; replace it with a fake we can check
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('NewAssignmentDrawer', () => {
  beforeEach(() => {
    mockPush.mockClear();
    render(<NewAssignmentDrawer closeHref="/dashboard" />);
  });

  it('opens as a dialog with a title', () => {
    expect(screen.getByRole('dialog', { name: 'New Assignment' })).toBeInTheDocument();
  });

  it('has a close link back to the dashboard', () => {
    expect(screen.getByRole('link', { name: 'Close' })).toHaveAttribute('href', '/dashboard');
  });

  it('closes when Escape is pressed', () => {
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockPush).toHaveBeenCalledWith('/dashboard', { scroll: false });
  });

  it('closes when the dark background is clicked', () => {
    fireEvent.click(screen.getByRole('button', { name: /close new assignment/i }));
    expect(mockPush).toHaveBeenCalledWith('/dashboard', { scroll: false });
  });
});
