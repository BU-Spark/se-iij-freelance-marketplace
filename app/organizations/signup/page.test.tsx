import { fireEvent, render, screen } from '@testing-library/react';
import OrganizationSignupPage from './page';

describe('Organization signup, step 1', () => {
  beforeEach(() => {
    render(<OrganizationSignupPage />);
  });

  it('asks only for the login details', () => {
    expect(screen.getByRole('heading', { level: 1, name: /sign up your newsroom/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
    expect(screen.queryByLabelText(/organization name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });

  it('keeps what is typed', () => {
    const name = screen.getByLabelText(/^your name/i);

    fireEvent.change(name, { target: { value: 'Sam Rivera' } });

    expect(name).toHaveValue('Sam Rivera');
  });
});
