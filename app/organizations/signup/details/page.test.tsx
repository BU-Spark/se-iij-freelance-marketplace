import { fireEvent, render, screen } from '@testing-library/react';
import OrganizationDetailsPage from './page';

const submit = () => fireEvent.click(screen.getByRole('button', { name: /create organization page/i }));

describe('Organization signup, step 2', () => {
  beforeEach(() => {
    render(<OrganizationDetailsPage />);
  });

  it('asks about the newsroom and its public page', () => {
    expect(screen.getByRole('group', { name: /your newsroom/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /what freelancers see/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^local/i })).toBeChecked();
  });

  it('points out what is missing and focuses the first problem', () => {
    submit();

    expect(screen.getByRole('alert')).toHaveTextContent(/check the highlighted fields/i);
    expect(screen.getByLabelText(/^organization name/i)).toHaveFocus();
    expect(screen.getByText(/pick at least one beat/i)).toBeInTheDocument();
  });

  it('clears a field’s error once the person types in it', () => {
    submit();
    const name = screen.getByLabelText(/^organization name/i);

    fireEvent.change(name, { target: { value: 'Signal Room' } });

    expect(name).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText(/enter your organization’s name/i)).not.toBeInTheDocument();
  });
});
