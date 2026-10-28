import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import ForgotPasswordPage from './page';

const mockCreate = jest.fn();
const mockAttemptFirstFactor = jest.fn();
const mockSetActive = jest.fn();
const assign = jest.fn();

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('@clerk/nextjs/legacy', () => ({
  useSignIn: () => ({
    isLoaded: true,
    signIn: { create: mockCreate, attemptFirstFactor: mockAttemptFirstFactor },
    setActive: mockSetActive,
  }),
}));

const originalLocation = window.location;

beforeAll(() => {
  Object.defineProperty(window, 'location', { configurable: true, writable: true, value: { assign } });
});

afterAll(() => {
  Object.defineProperty(window, 'location', { configurable: true, writable: true, value: originalLocation });
});

/** Sends a code for a valid email and waits for the reset step */
async function goToResetStep() {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'writer@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
  await screen.findByRole('heading', { name: /check your email/i });
}

describe('Forgot password page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockResolvedValue({});
    render(<ForgotPasswordPage />);
  });

  it('starts by asking for the account email', () => {
    expect(screen.getByRole('heading', { level: 1, name: /reset your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to log in/i })).toHaveAttribute('href', '/login');
  });

  it('validates the email before contacting Clerk', () => {
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('sends a reset code and asks for it with a new password', async () => {
    await goToResetStep();

    expect(mockCreate).toHaveBeenCalledWith({
      strategy: 'reset_password_email_code',
      identifier: 'writer@example.com',
    });
    expect(screen.getByText(/we sent a reset code to writer@example.com/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reset code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm new password$/i)).toBeInTheDocument();
  });

  it('explains when no account uses that email', async () => {
    mockCreate.mockRejectedValue({ errors: [{ code: 'form_identifier_not_found', longMessage: 'Not found' }] });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'nobody@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    expect(await screen.findByText(/no account found with that email/i)).toBeInTheDocument();
  });

  it('does not reset until the new passwords match', async () => {
    await goToResetStep();

    fireEvent.change(screen.getByLabelText(/reset code/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'correct-horse-battery' } });
    fireEvent.change(screen.getByLabelText(/^confirm new password$/i), { target: { value: 'wrong-horse' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockAttemptFirstFactor).not.toHaveBeenCalled();
  });

  it('resets the password, signs the editor in, and opens the dashboard', async () => {
    mockAttemptFirstFactor.mockResolvedValue({ status: 'complete', createdSessionId: 'sess_1' });
    mockSetActive.mockResolvedValue(undefined);
    await goToResetStep();

    fireEvent.change(screen.getByLabelText(/reset code/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'correct-horse-battery' } });
    fireEvent.change(screen.getByLabelText(/^confirm new password$/i), { target: { value: 'correct-horse-battery' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/dashboard'));
    expect(mockAttemptFirstFactor).toHaveBeenCalledWith({
      strategy: 'reset_password_email_code',
      code: '123456',
      password: 'correct-horse-battery',
    });
    expect(mockSetActive).toHaveBeenCalledWith({ session: 'sess_1' });
  });

  it('reports a bad reset code', async () => {
    mockAttemptFirstFactor.mockRejectedValue({ errors: [{ code: 'form_code_incorrect' }] });
    await goToResetStep();

    fireEvent.change(screen.getByLabelText(/reset code/i), { target: { value: '000000' } });
    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'correct-horse-battery' } });
    fireEvent.change(screen.getByLabelText(/^confirm new password$/i), { target: { value: 'correct-horse-battery' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/that code is not valid/i)).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });

  it('lets you switch back to a different email', async () => {
    await goToResetStep();

    fireEvent.click(screen.getByRole('button', { name: /use a different email/i }));

    expect(screen.getByRole('heading', { level: 1, name: /reset your password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveValue('writer@example.com');
  });
});
