import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignmentDrawer from './AssignmentDrawer';
import Modal from '../Modal/Modal';
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

  it('lets the editor who posted it switch to the edit form', async () => {
    render(<AssignmentDrawer assignment={assignment} closeHref="/dashboard" canEdit />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('heading', { name: 'Edit assignment' })).toBeInTheDocument();
  });

  it('leaves Escape to a popup opened from the footer', async () => {
    const onClose = jest.fn();
    render(
      <AssignmentDrawer
        assignment={assignment}
        closeHref="/dashboard"
        footer={
          <Modal title="Apply" onClose={onClose}>
            Form
          </Modal>
        }
      />
    );

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('keeps the page locked until the drawer and its popup are both gone', () => {
    const popup = (
      <Modal title="Apply" onClose={jest.fn()}>
        Form
      </Modal>
    );
    const view = render(<AssignmentDrawer assignment={assignment} closeHref="/dashboard" footer={popup} />);

    // closing only the popup leaves the drawer's lock in place
    view.rerender(<AssignmentDrawer assignment={assignment} closeHref="/dashboard" />);
    expect(document.body.style.overflow).toBe('hidden');

    // closing both at once, as the browser's Back button does, frees the page
    view.rerender(<AssignmentDrawer assignment={assignment} closeHref="/dashboard" footer={popup} />);
    view.unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
