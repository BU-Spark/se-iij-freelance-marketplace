import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignmentDrawer from './AssignmentDrawer';
import type { Assignment } from '../../types/assignments.types';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: jest.fn() }) }));

const assignment: Assignment = {
  id: 'assignment-1',
  organizationId: 'org-1',
  createdByUserId: 'user-1',
  title: 'Election night',
  description: 'Live coverage from the county clerk.',
  category: 'Reporting/Writing',
  slug: 'election-night-abc123',
  contact: 'Sam Desk',
  location: 'Remote',
  length: '800 words',
  deadline: null,
  compensation: '750',
  status: 'open',
  createdAt: new Date(2030, 0, 1),
  updatedAt: new Date(2030, 0, 1),
};

describe('AssignmentDrawer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the assignment in a dialog with a close button back to the list', () => {
    render(<AssignmentDrawer assignment={assignment} closeHref="/dashboard" />);

    expect(screen.getByRole('dialog', { name: 'Election night' })).toBeInTheDocument();
    expect(screen.getByText('Live coverage from the county clerk.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Close' })).toHaveAttribute('href', '/dashboard');
    expect(screen.queryByText(/back to/i)).not.toBeInTheDocument();
  });

  it('closes on Escape and on a click outside the panel', async () => {
    render(<AssignmentDrawer assignment={assignment} closeHref="/dashboard" />);

    await userEvent.keyboard('{Escape}');
    expect(push).toHaveBeenLastCalledWith('/dashboard', { scroll: false });

    await userEvent.click(screen.getByRole('button', { name: 'Close assignment' }));
    expect(push).toHaveBeenCalledTimes(2);
  });

  it('lets editors from the posting organization switch to the edit form', async () => {
    render(<AssignmentDrawer assignment={assignment} closeHref="/dashboard" canEdit />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('heading', { name: 'Edit assignment' })).toBeInTheDocument();
  });
});

describe('AssignmentDrawer content slot', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows extra content under the details and leaves Escape to a popup opened inside it', async () => {
    render(
      <AssignmentDrawer assignment={assignment} closeHref="/dashboard">
        <div role="dialog" aria-modal="true" aria-label="Decline">
          inner popup
        </div>
      </AssignmentDrawer>
    );

    expect(screen.getByText('inner popup')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(push).not.toHaveBeenCalled();
  });
});
