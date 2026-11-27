import { fireEvent, render, screen } from '@testing-library/react';
import OrganizationDetailsPage from './page';

describe('Organization signup, step 2', () => {
  beforeEach(() => {
    render(<OrganizationDetailsPage />);
  });

  it('asks about the newsroom and its public page', () => {
    expect(screen.getByRole('group', { name: /your newsroom/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /what freelancers see/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^local/i })).toBeChecked();
  });

  it('keeps what is typed', () => {
    const name = screen.getByLabelText(/^organization name/i);

    fireEvent.change(name, { target: { value: 'Signal Room' } });

    expect(name).toHaveValue('Signal Room');
  });
});
