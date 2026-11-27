import { fireEvent, render, screen } from '@testing-library/react';
import OrganizationSignupPage from './page';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const type = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('Organization signup, step 1', () => {
  beforeEach(() => {
    push.mockClear();
    render(<OrganizationSignupPage />);
  });

  it('asks only for the login details', () => {
    expect(screen.getByRole('heading', { level: 1, name: /sign up your newsroom/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
    expect(screen.queryByLabelText(/organization name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });

  it('moves on to the organization details', () => {
    type(/^your name/i, 'Sam Rivera');
    type(/^work email/i, 'sam@signalroom.org');
    type(/^password$/i, 'correct-horse-battery');
    type(/^confirm password$/i, 'correct-horse-battery');

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(push).toHaveBeenCalledWith('/organizations/signup/details');
  });
});
