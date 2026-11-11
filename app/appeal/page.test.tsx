import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AppealPage from './page';

const mockFetch = jest.fn();

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});

beforeEach(() => {
  jest.clearAllMocks();
});

const fill = (message = 'My portfolio was misread.') => {
  fireEvent.change(screen.getByLabelText(/email on your account/i), { target: { value: 'amara@example.com' } });
  fireEvent.change(screen.getByLabelText(/why should we look again/i), { target: { value: message } });
  fireEvent.click(screen.getByRole('button', { name: /send appeal/i }));
};

describe('Appeal page', () => {
  beforeEach(() => {
    render(<AppealPage />);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('explains what an appeal is and asks for the account email', () => {
    expect(screen.getByRole('heading', { level: 1, name: /appeal this decision/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email on your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/why should we look again/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });

  it('validates the email and the explanation before sending', () => {
    fireEvent.click(screen.getByRole('button', { name: /send appeal/i }));

    expect(screen.getByText(/enter the email address on your account/i)).toBeInTheDocument();
    expect(screen.getByText(/tell the team why/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sends the appeal and confirms it without asking for a login', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ received: true }) });

    fill();

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith('/api/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'amara@example.com', message: 'My portfolio was misread.' }),
      })
    );
    expect(await screen.findByText(/your appeal is with the story match team/i)).toBeInTheDocument();
    expect(screen.getByText(/amara@example.com/i)).toBeInTheDocument();
  });

  it('shows the server message when the appeal cannot be sent', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Unable to send your appeal right now.' }) });

    fill();

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to send your appeal right now.');
  });

  it('copes with the network being down', async () => {
    mockFetch.mockRejectedValue(new Error('offline'));
    const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    fill();

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not send your appeal/i);
    expect(consoleMock).toHaveBeenCalled();
  });
});
