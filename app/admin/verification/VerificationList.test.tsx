import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../components/Toast/ToastProvider';
import type { VerificationRequest } from '../../types/admin.types';
import VerificationList from './VerificationList';

const request: VerificationRequest = {
  id: 'v1',
  name: 'Amara Okafor',
  role: 'freelancer',
  location: 'Lagos, Nigeria',
  evidence: 'Press card and three clips',
  status: 'pending',
  requestedAt: '2026-11-01T12:00:00Z',
};

const requests: VerificationRequest[] = [
  request,
  { ...request, id: 'v2', name: 'Hannah Becker', role: 'editor', status: 'verified' },
];

const filter = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });
const click = (person: string, action: string) =>
  userEvent.click(
    within(screen.getByRole('group', { name: `Actions for ${person}` })).getByRole('button', { name: action })
  );

const renderList = () =>
  render(
    <ToastProvider>
      <VerificationList requests={requests} />
    </ToastProvider>
  );

describe('VerificationList', () => {
  it('opens on pending requests with a count per status', () => {
    renderList();

    expect(filter('Pending')).toHaveAttribute('aria-pressed', 'true');
    expect(within(filter('Verified')).getByText('1')).toBeInTheDocument();
    expect(within(filter('Rejected')).getByText('0')).toBeInTheDocument();

    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('Amara Okafor');
    expect(row).toHaveTextContent('Freelancer · Lagos, Nigeria');
    expect(row).toHaveTextContent('Press card and three clips');
    // the tab already says Pending, so the row does not repeat it
    expect(row).not.toHaveTextContent('Pending');
  });

  it('approves a pending request and confirms it', async () => {
    renderList();

    await click('Amara Okafor', 'Approve');

    expect(screen.getByText('Amara Okafor is now verified.')).toBeInTheDocument();
    expect(screen.getByText('All clear')).toBeInTheDocument();
    expect(within(filter('Verified')).getByText('2')).toBeInTheDocument();
  });

  it('keeps a rejection editable', async () => {
    renderList();

    await click('Amara Okafor', 'Reject');
    await userEvent.click(filter('Rejected'));
    expect(screen.getByRole('listitem')).toHaveTextContent('Amara Okafor');

    await click('Amara Okafor', 'Move back to pending');
    await userEvent.click(filter('Pending'));
    expect(screen.getByRole('listitem')).toHaveTextContent('Amara Okafor');
  });

  it('can take verification away from someone', async () => {
    renderList();
    await userEvent.click(filter('Verified'));

    await click('Hannah Becker', 'Reject');

    expect(within(filter('Rejected')).getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/Nobody has been verified yet/)).toBeInTheDocument();
  });
});
