import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProfilePanel from './ProfilePanel';
import { MOCK_PROFILE } from './config/constants';

const onlyFreelancer = { ...MOCK_PROFILE, roles: [MOCK_PROFILE.roles[0]] };

describe('ProfilePanel', () => {
  it('shows the basic info', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog', { name: 'My profile' })).toBeInTheDocument();
    expect(screen.getByText('Marcus Thorne')).toBeInTheDocument();
    expect(screen.getByText(MOCK_PROFILE.basic.email)).toBeInTheDocument();
    expect(screen.getByText(MOCK_PROFILE.basic.shortBio)).toBeInTheDocument();
  });

  it('shows one card per role with its own fields', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.getByText('Freelancer')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Usual rate')).toBeInTheDocument();
    expect(screen.getByText('Job title')).toBeInTheDocument();
    expect(screen.getByText('Reporting beats')).toBeInTheDocument();
  });

  it('prompts for a role when the profile has none yet', () => {
    const empty = { ...MOCK_PROFILE, roles: [] };
    render(<ProfilePanel profile={empty} onClose={jest.fn()} onAddRole={jest.fn()} />);

    expect(screen.getByText(/isn't finished yet/i)).toBeInTheDocument();
    // and still offers both roles to pick from
    expect(screen.getByRole('button', { name: /add the editor role/i })).toBeInTheDocument();
  });

  it('points at the field a role still needs before it counts as finished', () => {
    const editor = MOCK_PROFILE.roles.find((r) => r.role === 'editor');
    if (!editor) throw new Error('sample profile has no editor role');

    const profile = {
      ...MOCK_PROFILE,
      roles: [{ role: 'editor' as const, facts: { ...editor.facts, jobTitle: '' } }],
    };

    render(<ProfilePanel profile={profile} onClose={jest.fn()} onSaveRole={jest.fn()} />);

    expect(screen.getByText(/finish your editor profile: add a job title/i)).toBeInTheDocument();
  });

  it('has no prompt once every role is filled in', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveRole={jest.fn()} />);

    expect(screen.queryByText(/isn't finished yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/finish your .* profile/i)).not.toBeInTheDocument();
  });

  it('offers to add only the roles the person does not have', async () => {
    const onAddRole = jest.fn().mockResolvedValue(true);
    render(<ProfilePanel profile={onlyFreelancer} onClose={jest.fn()} onAddRole={onAddRole} />);
    expect(screen.queryByRole('button', { name: /add the freelancer role/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add the editor role/i }));

    await waitFor(() => expect(onAddRole).toHaveBeenCalledWith('editor'));
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

  it('edits and saves the basic info', async () => {
    const onSaveBasic = jest.fn().mockResolvedValue(true);
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveBasic={onSaveBasic} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit basic info' }));
    fireEvent.change(screen.getByLabelText('Short bio'), { target: { value: 'New short bio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onSaveBasic).toHaveBeenCalledWith(
        expect.objectContaining({ ...MOCK_PROFILE.basic, shortBio: 'New short bio' })
      )
    );
    // back to the normal card
    expect(await screen.findByRole('button', { name: 'Edit basic info' })).toBeInTheDocument();
  });

  it('keeps the form open when the save fails', async () => {
    const onSaveBasic = jest.fn().mockResolvedValue(false);
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveBasic={onSaveBasic} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit basic info' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaveBasic).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('does not save basic info without a first name', async () => {
    const onSaveBasic = jest.fn().mockResolvedValue(true);
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveBasic={onSaveBasic} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit basic info' }));
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Add your first name.')).toBeInTheDocument();
    expect(onSaveBasic).not.toHaveBeenCalled();
  });

  it('cancelling a role edit changes nothing', () => {
    const onSaveRole = jest.fn();
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveRole={onSaveRole} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Freelancer details' }));
    fireEvent.change(screen.getByLabelText('Usual rate'), { target: { value: '$2 / word' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSaveRole).not.toHaveBeenCalled();
    expect(screen.getByText('$1.10 / word')).toBeInTheDocument();
  });

  it('saves a role with its own fields', async () => {
    const onSaveRole = jest.fn().mockResolvedValue(true);
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveRole={onSaveRole} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Editor details' }));
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Managing editor' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onSaveRole).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'editor', facts: expect.objectContaining({ jobTitle: 'Managing editor' }) })
      )
    );
  });
});
