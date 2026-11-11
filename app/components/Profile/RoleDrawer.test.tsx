import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RoleDrawer from './RoleDrawer';
import RoleRow from './cards/RoleRow';
import { MOCK_PROFILE } from './config/constants';

const editor = MOCK_PROFILE.roles[1];

describe('RoleRow', () => {
  it('shows just the role name and opens on click', () => {
    const onOpen = jest.fn();
    render(<RoleRow details={editor} onOpen={onOpen} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Editor details' }));

    expect(onOpen).toHaveBeenCalled();
    expect(screen.queryByText('Contributing editor')).not.toBeInTheDocument();
  });
});

describe('RoleDrawer', () => {
  it('shows every field of the role, with the organisation by name', () => {
    render(<RoleDrawer details={editor} onClose={jest.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Editor details' })).toBeInTheDocument();
    expect(screen.getByText('Contributing editor')).toBeInTheDocument();
    expect(screen.getByText('The Meridian Post')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^edit/i })).not.toBeInTheDocument();
  });

  it('edits and saves, then goes back to the details', async () => {
    const onSave = jest.fn().mockResolvedValue(true);
    render(<RoleDrawer details={editor} onClose={jest.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Editor details' }));
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Managing editor' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ facts: expect.objectContaining({ jobTitle: 'Managing editor' }) })
      )
    );
    expect(await screen.findByRole('button', { name: 'Edit Editor details' })).toBeInTheDocument();
  });

  it('sends availability edits to the settings page', () => {
    render(<RoleDrawer details={editor} onClose={jest.fn()} onSave={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Editor details' }));

    expect(screen.getByRole('link', { name: /edit availability in settings/i })).toHaveAttribute(
      'href',
      '/dashboard/settings'
    );
    expect(screen.queryByLabelText('Time zone')).not.toBeInTheDocument();
  });

  it('keeps the form open when the save fails', async () => {
    const onSave = jest.fn().mockResolvedValue(false);
    render(<RoleDrawer details={editor} onClose={jest.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Editor details' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
