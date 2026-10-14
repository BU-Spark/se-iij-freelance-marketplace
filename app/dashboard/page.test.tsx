import { render, screen, within } from '@testing-library/react';
import Dashboard from './page';
import { ASSIGNMENTS, ROSTER } from './constants';

// Joey's Header has its own tests; swap it for a simple stand-in so these tests only check the dashboard
jest.mock('../components/header/Header', () => ({
  Header: () => <header>Header</header>,
}));

describe('Dashboard', () => {
  beforeEach(() => {
    render(<Dashboard />);
  });

  it('renders the shared header and the status bar with real numbers', () => {
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText(/editor: sarah jenkins/i)).toBeInTheDocument();
    expect(screen.getByText('2 open • 1 pending • 1 assigned')).toBeInTheDocument();
  });

  it('lists every roster member with the roster count', () => {
    const column = screen.getByRole('region', { name: /availability/i });
    expect(within(column).getByText(`5 of ${ROSTER.length} on roster`)).toBeInTheDocument();
    ROSTER.forEach((m) => {
      expect(within(column).getByRole('heading', { level: 3, name: m.name })).toBeInTheDocument();
    });
    expect(within(column).getByText('Free: 12p 2p 4p')).toBeInTheDocument();
  });

  it('lists every assignment with its details', () => {
    const column = screen.getByRole('region', { name: /assignments/i });
    expect(within(column).getAllByRole('article')).toHaveLength(ASSIGNMENTS.length);

    const card = within(column)
      .getByRole('heading', { name: /election night/i })
      .closest('article')!;
    expect(within(card).getByText(/sarah jenkins, news desk/i)).toBeInTheDocument();
    expect(within(card).getByText(/\$1\.10 \/ word \(≈ \$1,100 est\.\)/)).toBeInTheDocument();
    expect(within(card).getByText('3 interested')).toBeInTheDocument();
  });
});
