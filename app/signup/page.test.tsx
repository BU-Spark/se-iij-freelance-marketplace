import { fireEvent, render, screen } from '@testing-library/react';
import SignupPage from './page';

describe('Signup page', () => {
  beforeEach(() => {
    render(<SignupPage />);
  });

  it('renders the signup form with password confirmation', () => {
    expect(screen.getByRole('heading', { level: 1, name: /create your iij account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/^confirm password$/i)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });

  it('reveals and rehides the password text', () => {
    const password = screen.getByLabelText(/^password$/i);

    fireEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(password).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('reveals each password field independently', () => {
    fireEvent.click(screen.getByRole('button', { name: /show confirm password/i }));

    expect(screen.getByLabelText(/^confirm password$/i)).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
  });

  it('requires the passwords to match', () => {
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'writer@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'correct-horse-battery' } });
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: 'different-horse' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('requires the confirmation field to be filled in', () => {
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'writer@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'correct-horse-battery' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/re-enter your password/i)).toBeInTheDocument();
  });

  it('clears the mismatch error once the confirmation is corrected', () => {
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'writer@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'correct-horse-battery' } });
    fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: 'wrong-horse' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^confirm password$/i), { target: { value: 'correct-horse-battery' } });

    expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
  });
});
