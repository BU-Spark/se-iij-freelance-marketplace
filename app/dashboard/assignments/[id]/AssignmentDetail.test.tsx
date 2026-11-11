import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignmentDetail from './AssignmentDetail';
import type { Assignment } from '../../../types/assignments.types';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh, push: jest.fn() }) }));

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
  length: '800 words / 4 hours',
  deadline: new Date(2030, 0, 1, 23, 0),
  compensation: '750',
  status: 'open',
  createdAt: new Date(2030, 0, 1),
  updatedAt: new Date(2030, 0, 1),
};

describe('AssignmentDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('shows every detail of the assignment, including the description', () => {
    render(<AssignmentDetail assignment={assignment} canEdit={false} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Election night' })).toBeInTheDocument();
    expect(screen.getByText('Live coverage from the county clerk.')).toBeInTheDocument();
    expect(screen.getByText('800 words / 4 hours')).toBeInTheDocument();
    expect(screen.getByText('$750')).toBeInTheDocument();
    expect(screen.getByText('Point of contact: Sam Desk')).toBeInTheDocument();
  });

  it('hides the Edit button from people who cannot edit', () => {
    render(<AssignmentDetail assignment={assignment} canEdit={false} />);

    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('opens the form filled with the saved values and saves the changes', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ saved: true }) });
    render(<AssignmentDetail assignment={assignment} canEdit />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const title = screen.getByDisplayValue('Election night');
    expect(screen.getByDisplayValue('800')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    expect(screen.getByText('election-night-abc123')).toBeInTheDocument();

    await user.clear(title);
    await user.type(title, 'Election night recount');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/assignments/assignment-1',
      expect.objectContaining({ method: 'PATCH' })
    );
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toMatchObject({ title: 'Election night recount', length: '800', time: '4' });
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });

  it('keeps the form open and shows the error when saving fails', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Assignment not found.' }),
    });
    render(<AssignmentDetail assignment={assignment} canEdit />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Assignment not found.');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('cancelling throws away unsaved changes', async () => {
    const user = userEvent.setup();
    render(<AssignmentDetail assignment={assignment} canEdit />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.type(screen.getByDisplayValue('Election night'), ' XYZ');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Election night' })).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('links back to the assignments list and hides Edit from people who cannot edit', () => {
    render(<AssignmentDetail assignment={assignment} canEdit={false} />);

    expect(screen.getByRole('link', { name: /back to assignments/i })).toHaveAttribute(
      'href',
      '/dashboard/assignments'
    );
    expect(screen.getByText(/posted jan 1, 2030/i)).toBeInTheDocument();
    expect(screen.queryByText(/sample assignment/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });
});
