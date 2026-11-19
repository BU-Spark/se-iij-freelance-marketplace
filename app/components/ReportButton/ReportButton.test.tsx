import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../Toast/ToastProvider';
import ReportButton from './ReportButton';

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

const renderButton = () =>
  render(
    <ToastProvider>
      <ReportButton targetType="assignment" targetId="assignment-1" targetLabel="Transit strike explainer" />
    </ToastProvider>
  );

const openForm = () => userEvent.click(screen.getByRole('button', { name: 'Report Transit strike explainer' }));

describe('ReportButton', () => {
  it('opens a reason form for the thing being reported', async () => {
    renderButton();
    await openForm();

    expect(screen.getByRole('dialog', { name: 'Report this assignment' })).toBeInTheDocument();
    expect(screen.getByText('Transit strike explainer')).toBeInTheDocument();
  });

  it('will not send an empty report', async () => {
    renderButton();
    await openForm();

    await userEvent.click(screen.getByRole('button', { name: 'Send report' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Tell the team what is wrong.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the trimmed reason and confirms it was received', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ received: true, duplicate: false }) });
    renderButton();
    await openForm();

    await userEvent.type(screen.getByLabelText(/what's wrong/i), 'Pay is below the minimum.');
    expect(screen.getByLabelText(/what's wrong/i)).toHaveValue('Pay is below the minimum.');
    await userEvent.click(screen.getByRole('button', { name: 'Send report' }));

    expect(await screen.findByText('Report sent to the Story Match team.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: 'assignment',
        targetId: 'assignment-1',
        reason: 'Pay is below the minimum.',
      }),
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('says when the same person already reported it', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ received: true, duplicate: true }) });
    renderButton();
    await openForm();

    await userEvent.type(screen.getByLabelText(/what's wrong/i), 'Spam');
    await userEvent.click(screen.getByRole('button', { name: 'Send report' }));

    expect(await screen.findByText('You already reported this — the team is on it.')).toBeInTheDocument();
  });

  it('keeps the form open with the error when the report cannot be sent', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'That content could not be found.' }) });
    renderButton();
    await openForm();

    await userEvent.type(screen.getByLabelText(/what's wrong/i), 'Spam');
    await userEvent.click(screen.getByRole('button', { name: 'Send report' }));

    expect(await screen.findByText('That content could not be found.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Report this assignment' })).toBeInTheDocument();
  });
});
