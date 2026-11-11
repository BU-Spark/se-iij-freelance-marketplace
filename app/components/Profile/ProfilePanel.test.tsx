import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@clerk/nextjs';
import ProfilePanel from './ProfilePanel';
import { MOCK_PROFILE } from './config/constants';

const mockSignOut = jest.fn();

jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
  useClerk: () => ({ signOut: mockSignOut }),
}));

const onlyFreelancer = { ...MOCK_PROFILE, roles: [MOCK_PROFILE.roles[0]] };
const originalFetch = global.fetch;

beforeEach(() => {
  mockSignOut.mockClear();
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

describe('ProfilePanel completion bar', () => {
  const blankBios = { ...MOCK_PROFILE, basic: { ...MOCK_PROFILE.basic, shortBio: '', longBio: '' } };

  it('shows how much of the profile is filled in', () => {
    render(<ProfilePanel profile={blankBios} onClose={jest.fn()} />);

    expect(screen.getByRole('progressbar', { name: /profile completion/i })).toHaveAttribute('aria-valuenow', '90');
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('hides the bar once everything is filled in', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('does not count fields the panel cannot edit', () => {
    // availability is set during onboarding only, so it must not hold the bar below 100%
    const noAvailability = {
      ...MOCK_PROFILE,
      roles: MOCK_PROFILE.roles.map((details) => ({ ...details, facts: { ...details.facts, availability: '' } })),
    };

    render(<ProfilePanel profile={noAvailability} onClose={jest.fn()} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('is never complete without a role', () => {
    render(<ProfilePanel profile={{ ...blankBios, roles: [] }} onClose={jest.fn()} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});

describe('ProfilePanel', () => {
  it('opens the basic info in its own drawer', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.queryByText(MOCK_PROFILE.basic.email)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Basic info' }));

    const drawer = screen.getByRole('dialog', { name: 'Basic info' });
    expect(within(drawer).getByText(MOCK_PROFILE.basic.email)).toBeInTheDocument();
    expect(within(drawer).getByText(MOCK_PROFILE.basic.shortBio)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'My profile' })).toBeInTheDocument();
  });

  it('expands to the settings page', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.getByRole('link', { name: /open settings/i })).toHaveAttribute('href', '/dashboard/settings');
  });

  it('lists each role as one row by name, without its details', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Open Freelancer details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Editor details' })).toBeInTheDocument();
    expect(screen.queryByText('$1.10 / word')).not.toBeInTheDocument();
    expect(screen.queryByText('Reporting beats')).not.toBeInTheDocument();
  });

  it('shows the photo circle and name in the header', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.getByRole('heading', { name: 'My profile' })).toBeInTheDocument();
    expect(screen.getByText('Marcus Thorne')).toBeInTheDocument();
  });

  it('opens a role in its own drawer with all of its fields', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Freelancer details' }));

    const drawer = screen.getByRole('dialog', { name: 'Freelancer details' });
    expect(within(drawer).getByText('Usual rate')).toBeInTheDocument();
    expect(within(drawer).getByText('Reporting beats')).toBeInTheDocument();
    expect(within(drawer).queryByText('Job title')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'My profile' })).toBeInTheDocument();
  });

  it('closing the role drawer goes back to My profile', () => {
    const onClose = jest.fn();
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Editor details' }));

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Editor details' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'My profile' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('prompts for a role when the profile has none yet', () => {
    const empty = { ...MOCK_PROFILE, roles: [] };
    render(<ProfilePanel profile={empty} onClose={jest.fn()} />);

    expect(screen.getByText(/isn't finished yet/i)).toBeInTheDocument();
    // and still offers both roles to add
    expect(screen.getByRole('link', { name: /add the editor role/i })).toBeInTheDocument();
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

  it('shows the free-right-now switch and flips it', () => {
    const onSaveAvailable = jest.fn().mockResolvedValue(true);
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveAvailable={onSaveAvailable} />);

    const toggle = screen.getByRole('switch', { name: /free right now/i });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(toggle);

    expect(onSaveAvailable).toHaveBeenCalledWith(false);
  });

  it('has no switch when the panel cannot save', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('shows the dot on the profile photo when they are free', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);

    expect(screen.getByTestId('available-dot')).toBeInTheDocument();
  });

  it('links to onboarding to add only the roles the person does not have', () => {
    render(<ProfilePanel profile={onlyFreelancer} onClose={jest.fn()} />);

    expect(screen.queryByRole('link', { name: /add the freelancer role/i })).not.toBeInTheDocument();
    // adding a role needs that role's onboarding steps, so it links there rather than opening a form
    expect(screen.getByRole('link', { name: /add the editor role/i })).toHaveAttribute(
      'href',
      '/onboarding?add=editor'
    );
  });

  it('has no add link when the person has every role', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    expect(screen.queryByRole('link', { name: /add the/i })).not.toBeInTheDocument();
  });

  it('closes with the ✕', () => {
    const onClose = jest.fn();
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close My profile' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('has no Edit buttons when it cannot save', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Editor details' }));
    expect(screen.queryByRole('button', { name: /^edit/i })).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Open Basic info' }));
    expect(screen.queryByRole('button', { name: /^edit/i })).not.toBeInTheDocument();
  });

  it('edits and saves the basic info', async () => {
    const onSaveBasic = jest.fn().mockResolvedValue(true);
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveBasic={onSaveBasic} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Basic info' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit basic info' }));
    fireEvent.change(screen.getByLabelText('Short bio'), { target: { value: 'New short bio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onSaveBasic).toHaveBeenCalledWith(
        expect.objectContaining({ ...MOCK_PROFILE.basic, shortBio: 'New short bio' })
      )
    );
    expect(await screen.findByRole('button', { name: 'Edit basic info' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Basic info' })).toBeInTheDocument();
  });

  it('keeps the form open when the save fails', async () => {
    const onSaveBasic = jest.fn().mockResolvedValue(false);
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveBasic={onSaveBasic} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Basic info' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit basic info' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaveBasic).toHaveBeenCalled());
    expect(await screen.findByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('does not save basic info without a first name', async () => {
    const onSaveBasic = jest.fn().mockResolvedValue(true);
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveBasic={onSaveBasic} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Basic info' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit basic info' }));
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Add your first name.')).toBeInTheDocument();
    expect(onSaveBasic).not.toHaveBeenCalled();
  });

  it('points availability at the settings page instead of editing it here', () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveRole={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Editor details' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Editor details' }));

    expect(screen.getByRole('link', { name: /edit availability in settings/i })).toHaveAttribute(
      'href',
      '/dashboard/settings'
    );
    // the hours themselves are only editable on the settings page
    expect(screen.queryByText('Editor availability')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Time zone')).not.toBeInTheDocument();
  });

  it('cancelling a role edit changes nothing', () => {
    const onSaveRole = jest.fn();
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveRole={onSaveRole} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Freelancer details' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Freelancer details' }));
    fireEvent.change(screen.getByLabelText('Usual rate'), { target: { value: '$2 / word' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSaveRole).not.toHaveBeenCalled();
    const drawer = screen.getByRole('dialog', { name: 'Freelancer details' });
    expect(within(drawer).getByText('$1.10 / word')).toBeInTheDocument();
  });

  it('saves a role with its own fields', async () => {
    const onSaveRole = jest.fn().mockResolvedValue(true);
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveRole={onSaveRole} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Editor details' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Editor details' }));
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Managing editor' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onSaveRole).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'editor', facts: expect.objectContaining({ jobTitle: 'Managing editor' }) })
      )
    );
    expect(await screen.findByRole('button', { name: 'Edit Editor details' })).toBeInTheDocument();
  });

  it('suggests beats and mediums from the shared lists while editing a freelancer', async () => {
    const onSaveRole = jest.fn().mockResolvedValue(true);
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} onSaveRole={onSaveRole} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Freelancer details' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Freelancer details' }));

    const beats = screen.getByRole('combobox', { name: 'Reporting beats' });
    fireEvent.change(beats, { target: { value: 'photo' } });
    fireEvent.click(screen.getByRole('option', { name: 'Photography' }));

    const mediums = screen.getByRole('combobox', { name: 'Work mediums' });
    fireEvent.change(mediums, { target: { value: 'ill' } });
    fireEvent.click(screen.getByRole('option', { name: 'Illustration' }));

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(onSaveRole).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'freelancer',
          facts: expect.objectContaining({
            reportingBeats: ['Local government', 'Housing', 'Photography'],
            workMediums: ['Reporting', 'Explainers', 'Illustration'],
          }),
        })
      )
    );
  });

  it('signs out from the panel', async () => {
    render(<ProfilePanel profile={MOCK_PROFILE} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

    expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: '/' });
  });
});
