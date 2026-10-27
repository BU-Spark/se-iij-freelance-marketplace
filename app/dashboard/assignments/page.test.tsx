import { fireEvent, render, screen } from '@testing-library/react';
import AssignmentsPage from './page';

jest.mock('../../components/header/Header', () => ({
  Header: () => <header>Header</header>,
}));

describe('Assignment discovery', () => {
  beforeEach(() => render(<AssignmentsPage />));

  it('shows open opportunities without editor review actions', () => {
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: /election night/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /harbor night market/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /transit ridership/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /review candidates/i })).not.toBeInTheDocument();
  });

  it('searches titles, categories, and types without case or surrounding whitespace sensitivity', () => {
    for (const query of ['  ELECTION  ', 'Reporting/Writing', 'Reporting']) {
      fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: query } });
      expect(screen.getAllByRole('article')).toHaveLength(1);
      expect(screen.getByRole('heading', { name: /election night/i })).toBeInTheDocument();
    }
  });

  it('combines filters, announces no matches, and clears all controls', () => {
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Editing' } });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Remote' } });
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: /port authority/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: 'Election' } });
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No matches');
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByLabelText('Keywords')).toHaveValue('');
    expect(screen.getByLabelText('Category')).toHaveValue('');
    expect(screen.getByLabelText('Location')).toHaveValue('');
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
  });
});
