import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@clerk/nextjs';
import RoleDrawer from './RoleDrawer';
import RoleRow from './cards/RoleRow';
import { MOCK_PROFILE } from './config/constants';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));

const editor = MOCK_PROFILE.roles[1];
const originalFetch = global.fetch;

beforeEach(() => {
  // editing a role mounts its availability card, which asks for that role's saved pattern
  jest.mocked(useAuth).mockReturnValue({ userId: 'user-a', isLoaded: true } as ReturnType<typeof useAuth>);
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      role: 'editor',
      availableNow: false,
      timezone: 'UTC',
      days: [],
      startsAt: null,
      endsAt: null,
    }),
  }) as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

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

  it('keeps the form open when the save fails', async () => {
    const onSave = jest.fn().mockResolvedValue(false);
    render(<RoleDrawer details={editor} onClose={jest.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit Editor details' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
