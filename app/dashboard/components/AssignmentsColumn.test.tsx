import { fireEvent, render, screen, within } from '@testing-library/react';
import AssignmentsColumn from './AssignmentsColumn';
import { ASSIGNMENTS } from '../constants';

const tab = (name: string) =>
  within(screen.getByRole('group', { name: /filter assignments/i })).getByRole('button', { name });

describe('AssignmentsColumn', () => {
  beforeEach(() => {
    render(<AssignmentsColumn assignments={ASSIGNMENTS} />);
  });

  it('shows every assignment on the All tab', () => {
    expect(tab('All')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('article')).toHaveLength(ASSIGNMENTS.length);
  });

  it('shows only matching assignments when a tab is clicked', () => {
    fireEvent.click(tab('Invited'));
    expect(tab('Invited')).toHaveAttribute('aria-pressed', 'true');
    const invited = ASSIGNMENTS.filter((a) => a.status === 'invited');
    expect(screen.getAllByRole('article')).toHaveLength(invited.length);
    invited.forEach((a) => expect(screen.getByRole('heading', { name: a.title })).toBeInTheDocument());
  });

  it('says so when a tab is empty', () => {
    render(<AssignmentsColumn assignments={[]} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Open' })[1]);
    expect(screen.getByText('No open assignments.')).toBeInTheDocument();
  });
});
