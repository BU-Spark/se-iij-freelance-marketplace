import { fireEvent, render, screen, within } from '@testing-library/react';
import OrganizationDetailsPage from './page';

const type = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole('button', { name: /create organization page/i }));

describe('Organization signup, step 2', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
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

  it('previews the card as the newsroom types', () => {
    const preview = screen.getByRole('region', { name: /preview of your organization card/i });
    expect(preview).toHaveTextContent('Your organization');

    type(/^organization name/i, 'Signal Room');

    expect(within(preview).getByRole('heading', { name: 'Signal Room' })).toBeInTheDocument();
  });

  it('confirms complete details, says nothing was saved and lets them go back', () => {
    type(/^organization name/i, 'Signal Room');
    type(/^website/i, 'signalroom.org');
    type(/^city/i, 'Remote');
    type(/^tagline/i, 'Technology and public life');
    type(/^about/i, 'A nonprofit newsroom.');
    fireEvent.focus(screen.getByRole('combobox', { name: /beats/i }));
    fireEvent.click(screen.getByRole('option', { name: 'Tech' }));

    submit();

    expect(screen.getByRole('heading', { level: 1, name: /your page is ready/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/no account or page has been saved/i);

    fireEvent.click(screen.getByRole('button', { name: /edit details/i }));

    expect(screen.getByLabelText(/^organization name/i)).toHaveValue('Signal Room');
  });
});
