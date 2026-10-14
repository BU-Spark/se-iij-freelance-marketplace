import { render, screen, within } from '@testing-library/react';
import Dashboard from './page';

// Joey's Header has its own tests; swap it for a simple stand-in so these tests only check the dashboard
jest.mock('../components/header/Header', () => ({
  Header: () => <header>Header</header>,
}));

describe('Dashboard skeleton', () => {
  beforeEach(() => {
    render(<Dashboard />);
  });

  it('renders the shared header and the status bar', () => {
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText(/new pitches in inbox/i)).toBeInTheDocument();
  });

  it('renders the availability column with placeholder roster cards', () => {
    const column = screen.getByRole('region', { name: /availability/i });
    expect(within(column).getByRole('button', { name: 'day' })).toBeInTheDocument();
    expect(within(column).getAllByRole('heading', { level: 3, name: /freelancer name/i })).toHaveLength(3);
  });

  it('renders the assignments column with filters and placeholder cards', () => {
    const column = screen.getByRole('region', { name: /assignments/i });
    ['All', 'Open', 'Invited', 'Assigned'].forEach((f) => {
      expect(within(column).getByRole('button', { name: f })).toBeInTheDocument();
    });
    expect(within(column).getAllByRole('article')).toHaveLength(2);
  });
});
