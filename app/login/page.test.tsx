import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import LoginPage from './page';

const mockCreate = jest.fn();
const mockPrepareFirstFactor = jest.fn();
const mockAttemptFirstFactor = jest.fn();
const mockSetActive = jest.fn();
const mockFetch = jest.fn();
const assign = jest.fn();

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@clerk/nextjs/legacy', () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: {
      create: mockCreate,
      prepareFirstFactor: mockPrepareFirstFactor,
      attemptFirstFactor: mockAttemptFirstFactor,
    },
    setActive: mockSetActive,
  }),
}));

const originalLocation = window.location;

beforeAll(() => {
  Object.defineProperty(window, 'location', { configurable: true, writable: true, value: { assign } });
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterAll(() => {
  Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation });
});

const destinationResponse = (redirectTo: string) => ({ ok: true, json: async () => ({ redirectTo }) });

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue(destinationResponse('/dashboard'));
});

const fillCredentials = () => {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'sarah@newsroom.example' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correct horse' } });
  fireEvent.click(screen.getByRole('button', { name: /log in/i }));
};

const clientTrustAttempt = {
  status: 'needs_client_trust',
  supportedFirstFactors: [{ strategy: 'email_code', emailAddressId: 'em_1', safeIdentifier: 's***@newsroom.example' }],
};

describe('Login page', () => {
  beforeEach(() => {
    render(<LoginPage />);
  });

  it('renders the returning-user login form', () => {
    expect(screen.getByRole('heading', { level: 1, name: /log in to storymatch/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute('href', '/signup');
  });

  it('validates required credentials', () => {
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument();
  });

  it('starts the session when Clerk completes straight away', async () => {
    mockCreate.mockResolvedValue({ status: 'complete', createdSessionId: 'sess_1' });

    fillCredentials();

    await waitFor(() => expect(mockSetActive).toHaveBeenCalledWith({ session: 'sess_1' }));
    expect(assign).toHaveBeenCalledWith('/dashboard');
  });

  it('sends an admin to the admin dashboard', async () => {
    mockCreate.mockResolvedValue({ status: 'complete', createdSessionId: 'sess_admin' });
    mockFetch.mockResolvedValue(destinationResponse('/admin'));

    fillCredentials();

    await waitFor(() => expect(mockSetActive).toHaveBeenCalledWith({ session: 'sess_admin' }));
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/destination', { cache: 'no-store' });
    expect(assign).toHaveBeenCalledWith('/admin');
  });

  it('falls back to the dashboard when the destination check fails', async () => {
    mockCreate.mockResolvedValue({ status: 'complete', createdSessionId: 'sess_3' });
    mockFetch.mockRejectedValue(new Error('offline'));
    const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    fillCredentials();

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/dashboard'));
    consoleMock.mockRestore();
  });

  it('asks for an emailed code when this device is not trusted yet', async () => {
    mockCreate.mockResolvedValue(clientTrustAttempt);
    mockPrepareFirstFactor.mockResolvedValue(clientTrustAttempt);

    fillCredentials();

    await waitFor(() =>
      expect(mockPrepareFirstFactor).toHaveBeenCalledWith({ strategy: 'email_code', emailAddressId: 'em_1' })
    );
    expect(await screen.findByLabelText(/verification code/i)).toBeInTheDocument();
    expect(screen.getByText(/isn't recognised yet/i)).toBeInTheDocument();
    // no session until the code is accepted
    expect(mockSetActive).not.toHaveBeenCalled();
  });

  it('finishes the sign-in once the emailed code is accepted', async () => {
    mockCreate.mockResolvedValue(clientTrustAttempt);
    mockPrepareFirstFactor.mockResolvedValue(clientTrustAttempt);
    mockAttemptFirstFactor.mockResolvedValue({ status: 'complete', createdSessionId: 'sess_2' });

    fillCredentials();
    fireEvent.change(await screen.findByLabelText(/verification code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /verify and log in/i }));

    await waitFor(() =>
      expect(mockAttemptFirstFactor).toHaveBeenCalledWith({ strategy: 'email_code', code: '123456' })
    );
    expect(mockSetActive).toHaveBeenCalledWith({ session: 'sess_2' });
    expect(assign).toHaveBeenCalledWith('/dashboard');
  });

  it('rejects a wrong code without leaving the verification step', async () => {
    mockCreate.mockResolvedValue(clientTrustAttempt);
    mockPrepareFirstFactor.mockResolvedValue(clientTrustAttempt);
    mockAttemptFirstFactor.mockRejectedValue({ errors: [{ code: 'form_code_incorrect' }] });

    fillCredentials();
    fireEvent.change(await screen.findByLabelText(/verification code/i), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /verify and log in/i }));

    expect(await screen.findByText(/that code is not valid/i)).toBeInTheDocument();
    expect(mockSetActive).not.toHaveBeenCalled();
  });

  it('says something when Clerk stops at a status we cannot finish', async () => {
    mockCreate.mockResolvedValue({ status: 'needs_second_factor' });

    fillCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent(/two-factor/i);
    expect(mockSetActive).not.toHaveBeenCalled();
  });

  it('can go back to the credentials form', async () => {
    mockCreate.mockResolvedValue(clientTrustAttempt);
    mockPrepareFirstFactor.mockResolvedValue(clientTrustAttempt);

    fillCredentials();
    await screen.findByLabelText(/verification code/i);
    fireEvent.click(screen.getByRole('button', { name: /use a different account/i }));

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument();
  });
});
