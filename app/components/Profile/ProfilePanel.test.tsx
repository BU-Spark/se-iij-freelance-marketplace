import { fireEvent, render, screen } from '@testing-library/react';
import ProfilePanel from './ProfilePanel';
import { MOCK_PROFILE } from './config/constants';

const onlyFreelancer = { ...MOCK_PROFILE, roles: [MOCK_PROFILE.roles[0]] };

describe('ProfilePanel', () => {
  it('shows the basic info', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog', { name: 'My profile' })).toBeInTheDocument();
    expect(screen.getByText('Marcus Thorne')).toBeInTheDocument();
    expect(screen.getByText(MOCK_PROFILE.basic.email)).toBeInTheDocument();
    expect(screen.getByText(MOCK_PROFILE.basic.location)).toBeInTheDocument();
  });

  it('shows one card per role with its own details', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.getByText('Freelancer')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Usual rate')).toBeInTheDocument();
    expect(screen.getByText('Organisation')).toBeInTheDocument();
  });

  it('offers to add only the roles the person does not have', () => {
    const onAddRole = jest.fn();
    render(<ProfilePanel profile={onlyFreelancer} onClose={jest.fn()} onAddRole={onAddRole} />);
    expect(screen.queryByRole('button', { name: /add the freelancer role/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /add the editor role/i }));
    expect(onAddRole).toHaveBeenCalledWith('editor');
  });

  it('has no add button when the person has every role', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onAddRole={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /add the/i })).not.toBeInTheDocument();
  });

  it('closes with the ✕', () => {
    const onClose = jest.fn();
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close My profile' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('has no Edit buttons when it cannot save', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.queryByRole('button', { name: /^edit/i })).not.toBeInTheDocument();
  });

  it('edits and saves the basic info', () => {
    const onSaveBasic = jest.fn();
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveBasic={onSaveBasic} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit basic info' }));
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Manchester, UK' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    const { email, ...editable } = MOCK_PROFILE.basic;
    expect(onSaveBasic).toHaveBeenCalledWith({ ...editable, location: 'Manchester, UK' });
    // back to the normal card
    expect(screen.getByRole('button', { name: 'Edit basic info' })).toBeInTheDocument();
    expect(screen.getByText(email)).toBeInTheDocument();
  });

  it('does not let the email be edited, since Clerk owns it', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveBasic={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit basic info' }));

    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(screen.getByText(/can be changed in account settings/i)).toBeInTheDocument();
  });

  it('does not save basic info without a first name', () => {
    const onSaveBasic = jest.fn();
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveBasic={onSaveBasic} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit basic info' }));
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('Add your first name.')).toBeInTheDocument();
    expect(onSaveBasic).not.toHaveBeenCalled();
  });

  it('cancelling a role edit changes nothing', () => {
    const onSaveRole = jest.fn();
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveRole={onSaveRole} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Freelancer details' }));
    fireEvent.change(screen.getByLabelText('Bio'), { target: { value: 'New bio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSaveRole).not.toHaveBeenCalled();
    expect(screen.getByText(MOCK_PROFILE.roles[0].bio)).toBeInTheDocument();
  });

  it('saves a role with its own fields', () => {
    const onSaveRole = jest.fn();
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveRole={onSaveRole} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Editor details' }));
    fireEvent.change(screen.getByLabelText('Desk'), { target: { value: 'Business' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSaveRole).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'editor', facts: expect.objectContaining({ desk: 'Business' }) })
    );
  });
});
