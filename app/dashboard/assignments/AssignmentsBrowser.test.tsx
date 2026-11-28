import { fireEvent, render, screen, within } from '@testing-library/react';
import AssignmentsBrowser from './AssignmentsBrowser';
import type { Assignment } from '../../types/assignments.types';

const assignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  id: 'assignment-1',
  organizationId: null,
  createdByUserId: 'user-1',
  title: 'Election Night Live Coverage: District 4',
  description: 'Live coverage of the overnight session.',
  category: 'Reporting/Writing',
  slug: 'election-night',
  contact: 'Sam Desk',
  location: 'Central City Hall',
  length: '~ 6 hours',
  deadline: new Date(2030, 0, 1, 23, 0),
  compensation: '750',
  status: 'open',
  createdAt: new Date(2030, 0, 1),
  updatedAt: new Date(2030, 0, 1),
  ...overrides,
});

const assignments = [
  assignment(),
  assignment({
    id: 'assignment-2',
    title: 'Op-Ed Review: Port Authority expansion',
    description: 'Review a submitted op-ed.',
    category: 'Editing',
    location: 'Remote',
    length: '3–4 hours',
  }),
];

describe('AssignmentsBrowser', () => {
  it('shows the assignments without editor review actions', () => {
    render(<AssignmentsBrowser assignments={assignments} />);

    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: /election night/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /review candidates/i })).not.toBeInTheDocument();
  });

  it('searches titles, categories, and descriptions without case or whitespace sensitivity', () => {
    render(<AssignmentsBrowser assignments={assignments} />);

    for (const query of ['  ELECTION  ', 'Reporting/Writing', 'overnight session']) {
      fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: query } });
      expect(screen.getAllByRole('article')).toHaveLength(1);
      expect(screen.getByRole('heading', { name: /election night/i })).toBeInTheDocument();
    }
  });

  it('lists the closest match first when a word appears in several assignments', () => {
    const inTitle = assignment({ id: 'in-title', title: 'Harbor Commission vote', description: 'Daily briefing.' });
    const inDescription = assignment({
      id: 'in-description',
      title: 'Daily briefing',
      description: 'Covers the harbor vote.',
    });
    render(<AssignmentsBrowser assignments={[inDescription, inTitle]} />);

    fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: 'harbor' } });

    const [first] = screen.getAllByRole('article');
    expect(within(first).getByRole('heading', { name: /harbor commission/i })).toBeInTheDocument();
  });

  it('keeps the order it was given when nothing is searched', () => {
    const newer = assignment({ id: 'newer', title: 'Newer brief', createdAt: new Date(2030, 0, 2) });
    const older = assignment({ id: 'older', title: 'Older brief', createdAt: new Date(2030, 0, 1) });
    render(<AssignmentsBrowser assignments={[newer, older]} />);

    const [first] = screen.getAllByRole('article');
    expect(within(first).getByRole('heading', { name: /newer brief/i })).toBeInTheDocument();
  });

  it('combines filters, announces no matches, and clears all controls', () => {
    render(<AssignmentsBrowser assignments={assignments} />);

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

  it('shows the compensation and contact from the database', () => {
    render(<AssignmentsBrowser assignments={[assignment()]} />);

    const card = screen.getByRole('heading', { name: /election night/i }).closest('article')!;
    expect(card).toHaveTextContent('Point of contact: Sam Desk');
    expect(card).toHaveTextContent('$750');
    expect(card).toHaveTextContent('Central City Hall');
  });

  it('leaves legacy free-text compensation as it was stored', () => {
    render(<AssignmentsBrowser assignments={[assignment({ compensation: '$800 hr' })]} />);

    expect(screen.getByText('$800 hr')).toBeInTheDocument();
  });
});
