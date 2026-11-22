import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import OnboardingPage from './page';

// This suite exercises the full multi-step flow and can exceed Jest's 5s
// per-test default when it runs alongside the rest of the suite.
jest.setTimeout(15000);

type FakeAddress = {
  emailAddress: string;
  verification: { status: string };
  prepareVerification: jest.Mock;
  attemptVerification: jest.Mock;
};

/** Stands in for one of the Clerk user's email addresses */
const makeAddress = (emailAddress: string, status = 'unverified'): FakeAddress => {
  const address: FakeAddress = {
    emailAddress,
    verification: { status },
    prepareVerification: jest.fn(async () => address),
    attemptVerification: jest.fn(async ({ code }: { code: string }) => {
      if (code !== '123456') throw { errors: [{ longMessage: 'That code is not right.' }] };
      address.verification.status = 'verified';
      return address;
    }),
  };

  return address;
};

let mockClerkUser: { emailAddresses: FakeAddress[]; createEmailAddress: jest.Mock };

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: mockClerkUser, isLoaded: true }),
}));

// jsdom doesn't implement scrollTo, and the page calls it when changing steps
beforeAll(() => {
  window.scrollTo = jest.fn();
});

beforeEach(() => {
  mockClerkUser = {
    emailAddresses: [],
    createEmailAddress: jest.fn(async ({ email }: { email: string }) => {
      const address = makeAddress(email);
      mockClerkUser.emailAddresses.push(address);
      return address;
    }),
  };

  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ saved: true, roles: ['editor'] }),
  });
});

const chip = (label: string) => screen.getByRole('button', { name: new RegExp(`^[+✓]\\s*${label}$`, 'i') });

/** Type into a searchable tag picker and choose the matching option from its list */
const addTag = (label: RegExp, value: string) => {
  const input = screen.getByLabelText(label);
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  fireEvent.click(screen.getByRole('option', { name: value }));
};

const type = (label: RegExp, value: string) => {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};

const pickRole = (label: RegExp) => fireEvent.click(screen.getByRole('button', { name: label }));
const next = () => fireEvent.click(screen.getByRole('button', { name: /continue/i }));
const submit = () => fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

const ADULT_DOB = '1990-01-01';

/** Step 2 is the 18+ gate; every flow that picks a role walks through it */
const passAgeGate = () => {
  type(/date of birth/i, ADULT_DOB);
  next();
};

/** Picks roles on step 1 and moves on to the first profile step */
const startAs = (...labels: RegExp[]) => {
  labels.forEach(pickRole);
  next();
  passAgeGate();
};

/** The work email must be proven before the editor step will continue */
const verifyWorkEmail = async () => {
  fireEvent.click(screen.getByRole('button', { name: /^send code$/i }));
  fireEvent.change(await screen.findByLabelText(/verification code/i), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: /^verify$/i }));
  await screen.findByText(/work email verified/i);
};
/** The first profile step also collects the shared account fields */
const fillEditorStep = async () => {
  type(/first name/i, 'Sarah');
  type(/last name/i, 'Jenkins');
  type(/work email/i, 'sarah@newsroom.example');
  type(/position \/ title/i, 'News Editor');
  addTag(/search desks/i, 'Politics');
  await verifyWorkEmail();
};

const fillFreelancerStep = () => {
  type(/first name/i, 'Alex');
  type(/last name/i, 'Rivera');
  type(/^email/i, 'alex@example.com');
  addTag(/search beats/i, 'Climate/Environment');
  addTag(/search mediums/i, 'Photo');
};

/** On the second profile step the shared account fields are already collected */
const fillFreelancerRoleOnly = () => {
  addTag(/search beats/i, 'Climate/Environment');
  addTag(/search mediums/i, 'Photo');
};

/** The JSON body posted to /api/onboarding by the most recent submit */
const postedPayload = () => {
  const [, init] = (global.fetch as jest.Mock).mock.calls.at(-1) as [string, { body: string }];
  return JSON.parse(init.body);
};

describe('Onboarding page', () => {
  beforeEach(() => {
    render(<OnboardingPage />);
  });

  describe('Step 1: role picker', () => {
    it('renders the welcome heading and both role options', () => {
      expect(screen.getByRole('heading', { level: 1, name: /welcome aboard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /i'm an editor/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /i'm a freelancer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('requires at least one role before continuing', () => {
      next();
      expect(screen.getByRole('alert')).toHaveTextContent(/pick at least one role/i);
      expect(screen.getByRole('heading', { level: 1, name: /welcome aboard/i })).toBeInTheDocument();
    });

    it('lets the user tick both roles', () => {
      pickRole(/i'm an editor/i);
      pickRole(/i'm a freelancer/i);

      expect(screen.getByRole('button', { name: /i'm an editor/i })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /i'm a freelancer/i })).toHaveAttribute('aria-pressed', 'true');
      // one role -> 3 steps, both roles -> 5 steps
      expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument();
    });

    it('moves to the editor profile form when only the editor role is picked', () => {
      startAs(/i'm an editor/i);

      expect(screen.getByRole('heading', { level: 1, name: /your newsroom/i })).toBeInTheDocument();
      expect(screen.getByText(/step 3 of 4/i)).toBeInTheDocument();
    });

    it('moves to the freelancer profile form when only the freelancer role is picked', () => {
      startAs(/i'm a freelancer/i);

      expect(screen.getByRole('heading', { level: 1, name: /your reporting/i })).toBeInTheDocument();
      expect(screen.getByText(/step 3 of 4/i)).toBeInTheDocument();
    });
  });

  describe('Age gate', () => {
    beforeEach(() => {
      pickRole(/i'm an editor/i);
      next();
    });

    it('asks for a date of birth before the profile steps', () => {
      expect(screen.getByRole('heading', { level: 1, name: /first, your age/i })).toBeInTheDocument();
      expect(screen.getByText(/step 2 of 4 — your age/i)).toBeInTheDocument();
      expect(screen.getByText(/never saved/i)).toBeInTheDocument();
    });

    it('asks for the date when Continue is pressed with the field empty', () => {
      next();

      expect(screen.getByText(/enter your date of birth/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: /first, your age/i })).toBeInTheDocument();
    });

    it('refuses anyone under 18', () => {
      type(/date of birth/i, '2015-01-01');
      next();

      expect(screen.getByText(/must be 18 or older/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: /first, your age/i })).toBeInTheDocument();
    });

    it('lets someone through on their eighteenth birthday', () => {
      const today = new Date();
      const birthday = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      const value = [
        birthday.getFullYear(),
        String(birthday.getMonth() + 1).padStart(2, '0'),
        String(birthday.getDate()).padStart(2, '0'),
      ].join('-');

      type(/date of birth/i, value);
      next();

      expect(screen.getByRole('heading', { level: 1, name: /your newsroom/i })).toBeInTheDocument();
    });

    it('never sends the date of birth with the profile', async () => {
      type(/date of birth/i, ADULT_DOB);
      next();
      type(/first name/i, 'Sarah');
      type(/last name/i, 'Jenkins');
      type(/work email/i, 'sarah@newsroom.example');
      type(/position \/ title/i, 'News Editor');
      addTag(/search desks/i, 'Politics');
      await verifyWorkEmail();
      next();
      submit();

      await screen.findByRole('heading', { level: 1, name: /you're all set, sarah/i }, { timeout: 2000 });

      const body = postedPayload();
      expect(body).not.toHaveProperty('dateOfBirth');
      expect(body.user).not.toHaveProperty('dateOfBirth');
      expect(JSON.stringify(body)).not.toContain(ADULT_DOB);
    });

    it('goes back to the role picker', () => {
      fireEvent.click(screen.getByRole('button', { name: /^back$/i }));

      expect(screen.getByRole('heading', { level: 1, name: /welcome aboard/i })).toBeInTheDocument();
    });
  });

  describe('Step 2: editor profile', () => {
    beforeEach(() => {
      startAs(/i'm an editor/i);
    });

    it('shows editor-only fields', () => {
      expect(screen.getByLabelText(/position \/ title/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /organization/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /desks you staff/i })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /^beats$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /^mediums$/i })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/portfolio link/i)).not.toBeInTheDocument();
    });

    it('collects a location for editors too', () => {
      type(/based in/i, 'Chicago, IL');
      expect(screen.getByLabelText(/based in/i)).toHaveValue('Chicago, IL');
    });

    it('keeps the editor on the step until the work email is verified', async () => {
      type(/first name/i, 'Sarah');
      type(/last name/i, 'Jenkins');
      type(/work email/i, 'sarah@newsroom.example');
      type(/position \/ title/i, 'News Editor');
      addTag(/search desks/i, 'Politics');

      next();

      expect(await screen.findByText(/verify your work email to continue/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: /your newsroom/i })).toBeInTheDocument();
    });

    it('reports a work email another account already claimed', async () => {
      mockClerkUser.createEmailAddress.mockRejectedValueOnce({
        errors: [{ longMessage: 'This email address is already associated with another account.' }],
      });
      type(/work email/i, 'sarah@newsroom.example');

      fireEvent.click(screen.getByRole('button', { name: /^send code$/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/already associated with another account/i);
      expect(screen.queryByLabelText(/verification code/i)).not.toBeInTheDocument();
    });

    it('refuses a personal inbox as a work email', async () => {
      type(/work email/i, 'sarah@gmail.com');

      fireEvent.click(screen.getByRole('button', { name: /^send code$/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/not a personal inbox/i);
      expect(mockClerkUser.createEmailAddress).not.toHaveBeenCalled();
    });

    it('keeps the code input open when the code is wrong', async () => {
      type(/work email/i, 'sarah@newsroom.example');

      fireEvent.click(screen.getByRole('button', { name: /^send code$/i }));
      fireEvent.change(await screen.findByLabelText(/verification code/i), { target: { value: '000000' } });
      fireEvent.click(screen.getByRole('button', { name: /^verify$/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/that code is not right/i);
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    it('shows validation errors when continuing with an empty form', () => {
      next();
      expect(screen.getByText(/please enter your first name/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter your last name/i)).toBeInTheDocument();
      expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/what's your position\?/i)).toBeInTheDocument();
      expect(screen.getByText(/pick at least one desk/i)).toBeInTheDocument();
      // still on the profile step
      expect(screen.getByRole('heading', { level: 1, name: /your newsroom/i })).toBeInTheDocument();
    });

    it('updates the live preview as the user types', () => {
      type(/first name/i, 'Sarah');
      type(/last name/i, 'Jenkins');
      type(/position \/ title/i, 'News Editor');
      expect(screen.getByRole('heading', { level: 4, name: 'Sarah Jenkins' })).toBeInTheDocument();
      expect(screen.getByText('SJ')).toBeInTheDocument();
      expect(screen.getByText(/news editor · the meridian post/i)).toBeInTheDocument();
    });

    it('can go back to the role picker', () => {
      fireEvent.click(screen.getByRole('button', { name: /change role/i }));
      expect(screen.getByRole('heading', { level: 1, name: /welcome aboard/i })).toBeInTheDocument();
    });

    it('lets the editor add a new organization', () => {
      fireEvent.click(screen.getByRole('button', { name: /add new organization/i }));
      fireEvent.change(screen.getByPlaceholderText(/newsroom name/i), { target: { value: 'Harbor Gazette' } });
      fireEvent.change(screen.getByPlaceholderText(/city/i), { target: { value: 'Boston' } });
      fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
      expect(screen.getByRole('button', { name: /harbor gazette/i })).toBeInTheDocument();
    });

    it('reaches the success screen with valid details', async () => {
      await fillEditorStep();
      next();
      submit();

      expect(
        await screen.findByRole('heading', { level: 1, name: /you're all set, sarah/i }, { timeout: 2000 })
      ).toBeInTheDocument();
      expect(screen.getByText(/your editor profile is live/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /post first assignment/i })).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Step 2: freelancer profile', () => {
    beforeEach(() => {
      startAs(/i'm a freelancer/i);
    });

    it('shows freelancer-only fields', () => {
      expect(screen.getByRole('heading', { name: /^beats$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^skills$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /^mediums$/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/portfolio link/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/position \/ title/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /organization/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /desks you staff/i })).not.toBeInTheDocument();
    });

    it('rejects a portfolio link without http(s)', () => {
      type(/portfolio link/i, 'myportfolio.com');
      expect(screen.getByText(/link should start with http:\/\/ or https:\/\//i)).toBeInTheDocument();
    });

    it('offers the beats the team manages, with "Other" always available', async () => {
      (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
        url === '/api/beats'
          ? { ok: true, json: async () => ({ beats: ['Housing', 'Water rights'] }) }
          : { ok: true, json: async () => ({ saved: true, roles: ['freelancer'] }) }
      );

      cleanup();
      render(<OnboardingPage />);
      startAs(/i'm a freelancer/i);

      const input = screen.getByLabelText(/search beats/i);

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'water' } });
      expect(await screen.findByRole('option', { name: 'Water rights' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Climate/Environment' })).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'other' } });
      expect(screen.getByRole('option', { name: 'Other/Not listed here' })).toBeInTheDocument();
    });

    it('requires at least one beat and one medium', () => {
      next();
      expect(screen.getByText(/pick at least one beat/i)).toBeInTheDocument();
      expect(screen.getByText(/pick at least one medium/i)).toBeInTheDocument();
    });

    it('asks which beat when "Other/Not listed here" is picked', () => {
      addTag(/search beats/i, 'Other/Not listed here');
      addTag(/search mediums/i, 'Photo');
      next();

      expect(screen.getByLabelText(/your beat/i)).toBeInTheDocument();
      expect(screen.getByText(/tell us which beat you cover/i)).toBeInTheDocument();
    });

    it('sends the other beat and the skills with the profile', async () => {
      fillFreelancerStep();
      addTag(/search beats/i, 'Other/Not listed here');
      type(/your beat/i, 'Water rights in the Central Valley');
      addTag(/search skills/i, 'Investigative Journalism');
      next();
      submit();

      await screen.findByRole('heading', { level: 1, name: /you're all set, alex/i }, { timeout: 2000 });

      const body = postedPayload();
      expect(body.freelancer.beatOther).toBe('Water rights in the Central Valley');
      expect(body.freelancer.skills).toEqual(['Investigative Journalism']);
    });

    it('reaches the success screen with valid details', async () => {
      fillFreelancerStep();
      next();
      submit();

      expect(
        await screen.findByRole('heading', { level: 1, name: /you're all set, alex/i }, { timeout: 2000 })
      ).toBeInTheDocument();
      expect(screen.getByText(/your freelancer profile is live/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /browse assignments/i })).toHaveAttribute(
        'href',
        '/dashboard/freelancer'
      );
    });
  });

  describe('Profile photo', () => {
    const uploadPhoto = (file: File) =>
      fireEvent.change(screen.getByLabelText(/add photo/i), { target: { files: [file] } });

    const png = () =>
      new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], 'me.png', { type: 'image/png' });

    /** Answers the upload with a signed URL and onboarding with a normal save */
    const mockUpload = () => {
      (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
        url === '/api/uploads/photo'
          ? { ok: true, json: async () => ({ key: 'photos/clerk-1/me.png', url: 'https://signed.example/me.png' }) }
          : { ok: true, json: async () => ({ saved: true, roles: ['editor'] }) }
      );
    };

    it('uploads the photo and shows it in the live preview', async () => {
      mockUpload();
      startAs(/i'm an editor/i);

      uploadPhoto(png());

      expect(await screen.findByAltText(/your profile photo/i)).toHaveAttribute('src', 'https://signed.example/me.png');
    });

    it('saves the S3 key with the profile', async () => {
      mockUpload();
      startAs(/i'm an editor/i);
      uploadPhoto(png());
      await screen.findByAltText(/your profile photo/i);

      await fillEditorStep();
      next();
      submit();

      await screen.findByRole('heading', { level: 1, name: /you're all set, sarah/i }, { timeout: 2000 });

      const [, init] = (global.fetch as jest.Mock).mock.calls.at(-1) as [string, { body: string }];
      expect(JSON.parse(init.body).user.photoKey).toBe('photos/clerk-1/me.png');
    });

    it('rejects a file that is not an image without uploading it', async () => {
      startAs(/i'm an editor/i);

      uploadPhoto(new File(['hello'], 'notes.txt', { type: 'text/plain' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(/jpeg, png or webp/i);
      expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/uploads/photo'), expect.anything());
    });
  });

  describe('Step 3: preferences', () => {
    describe('editor', () => {
      beforeEach(async () => {
        startAs(/i'm an editor/i);
        await fillEditorStep();
        next();
      });

      it('shows the editor preference fields only', () => {
        expect(screen.getByRole('heading', { level: 1, name: /how you work/i })).toBeInTheDocument();
        expect(screen.getByText(/step 4 of 4/i)).toBeInTheDocument();
        expect(screen.getByText(/preferred pitch format/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /editorial preferences/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/your rate/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/communities you cover/i)).not.toBeInTheDocument();
      });

      it('sends the preferences, availability and long bio with the profile', async () => {
        fireEvent.click(chip('Email pitch'));
        type(/average response time/i, '3');
        fireEvent.click(screen.getByRole('button', { name: 'Monday' }));
        type(/long bio/i, 'I commission accountability work.');
        submit();

        await screen.findByRole('heading', { level: 1, name: /you're all set, sarah/i }, { timeout: 2000 });

        const body = postedPayload();
        expect(body.roles).toEqual(['editor']);
        expect(body.freelancer).toBeUndefined();
        expect(body.user.roles).toEqual(['EDITOR']);
        expect(body.user.longBio).toBe('I commission accountability work.');
        expect(body.user.preferences).toEqual({
          theme: 'system',
          language: 'English',
          notifications: { email: true, push: false },
        });
        expect(body.editor.pitchPreferences).toMatchObject({
          preferredPitchFormat: 'Email pitch',
          averageResponseTime: 3,
        });
        expect(body.editor.availability).toMatchObject({
          source: 'manual',
          days: ['monday'],
          typicalWorkingWindow: { startsAt: '09:00', endsAt: '17:00' },
        });
      });

      it('lets the editor go back to the profile step', () => {
        fireEvent.click(screen.getByRole('button', { name: /back to your newsroom/i }));
        expect(screen.getByRole('heading', { level: 1, name: /your newsroom/i })).toBeInTheDocument();
      });
    });

    describe('freelancer', () => {
      beforeEach(() => {
        startAs(/i'm a freelancer/i);
        fillFreelancerStep();
        next();
      });

      it('shows the freelancer preference fields only', () => {
        expect(screen.getByRole('heading', { level: 1, name: /rates & availability/i })).toBeInTheDocument();
        expect(screen.getByText(/step 4 of 4/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/your rate/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/communities you cover/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /beat tags/i })).toBeInTheDocument();
        expect(screen.queryByText(/preferred pitch format/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: /editorial preferences/i })).not.toBeInTheDocument();
      });

      it('treats every preference as optional', async () => {
        submit();
        expect(
          await screen.findByRole('heading', { level: 1, name: /you're all set, alex/i }, { timeout: 2000 })
        ).toBeInTheDocument();
      });

      it('rejects an end time that is before the start time', () => {
        fireEvent.click(screen.getByRole('button', { name: 'Monday' }));
        type(/ends at/i, '08:00');
        submit();
        expect(screen.getByText(/end time must be after the start time/i)).toBeInTheDocument();
        expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/onboarding'), expect.anything());
      });

      it('sends the rate, communities and availability with the profile', async () => {
        type(/your rate/i, '0.75');
        type(/communities you cover/i, 'South Texas');
        fireEvent.click(screen.getByRole('button', { name: 'Tuesday' }));
        submit();

        await screen.findByRole('heading', { level: 1, name: /you're all set, alex/i }, { timeout: 2000 });

        const body = postedPayload();
        expect(body.roles).toEqual(['freelancer']);
        expect(body.editor).toBeUndefined();
        expect(body.freelancer.rate).toBe('$0.75 / word');
        expect(body.freelancer.communityCovered).toBe('South Texas');
        expect(body.freelancer.availability).toMatchObject({ days: ['tuesday'] });
      });
    });
  });

  describe('both roles', () => {
    let fetchMock: jest.Mock;

    beforeEach(() => {
      fetchMock = global.fetch as jest.Mock;
      startAs(/i'm an editor/i, /i'm a freelancer/i);
    });

    it('walks the editor steps before the freelancer steps', async () => {
      expect(screen.getByText(/step 3 of 6 — your newsroom/i)).toBeInTheDocument();

      await fillEditorStep();
      next();
      expect(screen.getByText(/step 4 of 6 — how you work/i)).toBeInTheDocument();

      next();
      expect(screen.getByText(/step 5 of 6 — your reporting/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: /your reporting/i })).toBeInTheDocument();
      // the shared account fields belong to the first profile step only
      expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/^email/i)).not.toBeInTheDocument();

      fillFreelancerRoleOnly();
      next();
      expect(screen.getByText(/step 6 of 6 — rates & availability/i)).toBeInTheDocument();
    });

    it('submits both records with both roles', async () => {
      await fillEditorStep();
      next();
      next();
      fillFreelancerRoleOnly();
      next();
      submit();

      await screen.findByRole('heading', { level: 1, name: /you're all set, sarah/i }, { timeout: 2000 });

      // the beat list and the onboarding save are the only requests now that Clerk sends the codes
      const saves = fetchMock.mock.calls.filter(([url]) => url === '/api/onboarding');
      expect(saves).toHaveLength(1);
      const body = postedPayload();
      expect(body.roles).toEqual(['editor', 'freelancer']);
      expect(body.user.roles).toEqual(['EDITOR', 'FREELANCER']);
      // the second role must not overwrite the shared details
      expect(body.user.firstName).toBe('Sarah');
      expect(body.editor.jobTitle).toBe('News Editor');
      expect(body.freelancer.reportingBeats).toEqual(['Climate/Environment']);
      expect(screen.getByText(/both profiles are live/i)).toBeInTheDocument();
    });

    it('drops a role from the flow when it is unticked again', () => {
      fireEvent.click(screen.getByRole('button', { name: /change role/i }));
      pickRole(/i'm a freelancer/i);
      next(); // role -> age gate
      next(); // gate already passed, on to the first profile step

      expect(screen.getByText(/step 3 of 4 — your newsroom/i)).toBeInTheDocument();
    });
  });
});

describe('adding the other role from the profile panel', () => {
  beforeEach(() => {
    // the panel links here with ?add=<role>
    window.history.replaceState({}, '', '/onboarding?add=editor');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        roles: ['freelancer'],
        data: { firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah@newsroom.example', reportingBeats: ['Housing'] },
      }),
    });
    render(<OnboardingPage />);
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('skips the role picker and opens on the missing role', async () => {
    expect(await screen.findByRole('heading', { level: 1, name: /your newsroom/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: /welcome aboard/i })).not.toBeInTheDocument();
  });

  it('does not ask for a date of birth when adding a role', async () => {
    await screen.findByRole('heading', { level: 1, name: /your newsroom/i });

    expect(screen.queryByLabelText(/date of birth/i)).not.toBeInTheDocument();
  });

  it('opens with the saved answers already filled in', async () => {
    await screen.findByRole('heading', { level: 1, name: /your newsroom/i });

    expect(screen.getByLabelText(/first name/i)).toHaveValue('Sarah');
    expect(screen.getByLabelText(/work email/i)).toHaveValue('sarah@newsroom.example');
  });

  it('accepts an address Clerk already verified without sending a new code', async () => {
    const saved = makeAddress('sarah@newsroom.example', 'verified');
    mockClerkUser.emailAddresses = [saved];
    cleanup();
    render(<OnboardingPage />);

    await screen.findByRole('heading', { level: 1, name: /your newsroom/i });
    fireEvent.click(screen.getByRole('button', { name: /^send code$/i }));

    expect(await screen.findByText(/work email verified/i)).toBeInTheDocument();
    expect(saved.prepareVerification).not.toHaveBeenCalled();
    expect(mockClerkUser.createEmailAddress).not.toHaveBeenCalled();
  });
});
