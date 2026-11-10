import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import AssignmentPage from './page';
import { getAssignment, loadAssignmentViewer } from '../../../../lib/assignments';
import type { Assignment } from '../../../types/assignments.types';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(async () => ({ userId: 'clerk-1' })) }));
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
jest.mock('../../../components/header/Header', () => ({ Header: () => <header>Header</header> }));
jest.mock('../../../../lib/db', () => ({ db: { query: jest.fn() } }));
jest.mock('../../../../lib/assignments', () => ({
  ...jest.requireActual('../../../../lib/assignments'),
  getAssignment: jest.fn(),
  loadAssignmentViewer: jest.fn(),
}));

const getAssignmentMock = getAssignment as jest.Mock;
const loadViewerMock = loadAssignmentViewer as jest.Mock;

const assignment: Assignment = {
  id: 'assignment-1',
  organizationId: 'org-1',
  createdByUserId: 'user-1',
  title: 'Election night',
  description: 'Live coverage',
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

const renderPage = async () => render(await AssignmentPage({ params: Promise.resolve({ id: 'assignment-1' }) }));

describe('Assignment detail page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAssignmentMock.mockResolvedValue(assignment);
  });

  it('shows the assignment to editors from the posting organization', async () => {
    loadViewerMock.mockResolvedValue({ userId: 'user-2', roles: ['editor'], organizationId: 'org-1' });

    await renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Election night' })).toBeInTheDocument();
  });

  it('shows freelancers open assignments', async () => {
    loadViewerMock.mockResolvedValue({ userId: 'user-5', roles: ['freelancer'], organizationId: null });

    await renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Election night' })).toBeInTheDocument();
  });

  it('is a 404 for editors from another organization', async () => {
    loadViewerMock.mockResolvedValue({ userId: 'user-3', roles: ['editor'], organizationId: 'org-2' });

    await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('opens sample desk cards too', async () => {
    getAssignmentMock.mockResolvedValue(null);
    loadViewerMock.mockResolvedValue({ userId: 'user-2', roles: ['editor'], organizationId: 'org-1' });

    render(await AssignmentPage({ params: Promise.resolve({ id: 'port-oped' }) }));

    expect(screen.getByRole('heading', { level: 1, name: /port authority/i })).toBeInTheDocument();
    expect(screen.getByText('Point of contact: David Park, Opinion')).toBeInTheDocument();
    expect(screen.getByText(/\$85 \/ hr/)).toBeInTheDocument();
    expect(screen.getByText(/sample assignment/i)).toBeInTheDocument();
  });

  it('is a 404 when the assignment does not exist', async () => {
    getAssignmentMock.mockResolvedValue(null);
    loadViewerMock.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
