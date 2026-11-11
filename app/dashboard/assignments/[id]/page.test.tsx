import { redirect } from 'next/navigation';
import AssignmentPage from './page';
import { loadAssignmentViewer } from '../../../../lib/assignments';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(async () => ({ userId: 'clerk-1' })) }));
jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));
jest.mock('../../../../lib/assignments', () => ({ loadAssignmentViewer: jest.fn() }));

const loadViewerMock = loadAssignmentViewer as jest.Mock;

const visit = (id = 'assignment-1') => AssignmentPage({ params: Promise.resolve({ id }) });

describe('Old assignment detail URL', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens the assignment drawer on the editor desk for editors', async () => {
    loadViewerMock.mockResolvedValue({ userId: 'user-2', roles: ['editor'], organizationId: 'org-1' });

    await expect(visit()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/dashboard?assignment=assignment-1');
  });

  it('prefers the editor desk for people who are both editors and freelancers', async () => {
    loadViewerMock.mockResolvedValue({ userId: 'user-2', roles: ['freelancer', 'editor'], organizationId: 'org-1' });

    await expect(visit()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/dashboard?assignment=assignment-1');
  });

  it('opens the drawer on the freelancer assignments page for freelancers', async () => {
    loadViewerMock.mockResolvedValue({ userId: 'user-5', roles: ['freelancer'], organizationId: null });

    await expect(visit()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/dashboard/assignments?assignment=assignment-1');
  });
});
