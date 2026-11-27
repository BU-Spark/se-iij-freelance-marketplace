import { render, screen } from '@testing-library/react';
import FreelancerPage from './page';
import { loadAssignmentView } from '../assignments/loadAssignmentView';
import type { Assignment } from '../../types/assignments.types';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(async () => ({ userId: 'clerk-1' })) }));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/dashboard/freelancer',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('../../../lib/roster', () => ({ listInvitesForFreelancer: jest.fn(async () => []) }));
jest.mock('../../../lib/assignments', () => ({
  listOpenAssignments: jest.fn(async () => []),
  loadAssignmentViewer: jest.fn(async () => ({ userId: 'user-1', roles: ['freelancer'], organizationId: null })),
}));
jest.mock('../assignments/loadAssignmentView', () => ({ loadAssignmentView: jest.fn(async () => null) }));
jest.mock('../../components/AssignmentDrawer/AssignmentDrawer', () => ({
  __esModule: true,
  default: ({ assignment, closeHref, canEdit }: { assignment: Assignment; closeHref: string; canEdit?: boolean }) => (
    <div role="dialog" aria-label={assignment.title} data-close-href={closeHref} data-can-edit={String(!!canEdit)} />
  ),
}));

const viewMock = loadAssignmentView as jest.Mock;

const visit = async (searchParams: Record<string, string> = {}) =>
  render(await FreelancerPage({ searchParams: Promise.resolve(searchParams) }));

describe('Freelancer dashboard page', () => {
  beforeEach(() => jest.clearAllMocks());

  it('has no drawer open by default', async () => {
    await visit();

    expect(viewMock).toHaveBeenCalledWith(undefined);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the asked-for assignment over the dashboard and closes back to it', async () => {
    viewMock.mockResolvedValue({ assignment: { id: 'a-1', title: 'City hall budget' }, canEdit: false });
    await visit({ assignment: 'a-1' });

    expect(viewMock).toHaveBeenCalledWith('a-1');
    expect(screen.getByRole('dialog', { name: 'City hall budget' })).toHaveAttribute(
      'data-close-href',
      '/dashboard/freelancer'
    );
  });

  it('never offers edit or delete, even when the viewer could edit the assignment elsewhere', async () => {
    viewMock.mockResolvedValue({ assignment: { id: 'a-1', title: 'City hall budget' }, canEdit: true });
    await visit({ assignment: 'a-1' });

    expect(screen.getByRole('dialog', { name: 'City hall budget' })).toHaveAttribute('data-can-edit', 'false');
  });
});
