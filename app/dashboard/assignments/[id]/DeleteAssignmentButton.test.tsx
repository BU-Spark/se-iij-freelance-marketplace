import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ToastProvider } from '../../../components/Toast/ToastProvider';
import DeleteAssignmentButton from './DeleteAssignmentButton';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: jest.fn() }),
}));

const originalFetch = global.fetch;
const fetchMock = jest.fn();

const renderButton = (onDeleted?: () => void) =>
  render(
    <ToastProvider>
      <DeleteAssignmentButton assignmentId="assignment-1" onDeleted={onDeleted} />
    </ToastProvider>
  );

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ deleted: true }) });
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('DeleteAssignmentButton', () => {
  it('asks before deleting anything', () => {
    renderButton();

    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('dialog', { name: /delete this assignment/i })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deletes once confirmed and tells the caller', async () => {
    const onDeleted = jest.fn();
    renderButton(onDeleted);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete assignment' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith('/api/assignments/assignment-1', { method: 'DELETE' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the confirmation without deleting when the editor keeps it', () => {
    renderButton();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the confirmation open and says so when deleting fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'nope' }) });
    const onDeleted = jest.fn();
    renderButton(onDeleted);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete assignment' }));

    expect(await screen.findByText(/could not delete this assignment/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /delete this assignment/i })).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
