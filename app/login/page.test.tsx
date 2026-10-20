import { fireEvent, render, screen } from '@testing-library/react';
import LoginPage from './page';

describe('Login page', () => {
  beforeEach(() => {
    render(<LoginPage />);
  });

  it('renders the returning-user login form', () => {
    expect(screen.getByRole('heading', { level: 1, name: /log in to iij/i })).toBeInTheDocument();
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
});
