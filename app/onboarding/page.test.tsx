import { fireEvent, render, screen } from '@testing-library/react';
import OnboardingPage from './page';

// jsdom doesn't implement scrollTo, and the page calls it when changing steps
beforeAll(() => {
  window.scrollTo = jest.fn();
});

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ saved: true }),
  });
});

const chip = (label: string) => screen.getByRole('button', { name: new RegExp(`^[+✓]\\s*${label}$`, 'i') });

const type = (label: RegExp, value: string) => {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};

const next = () => fireEvent.click(screen.getByRole('button', { name: /continue/i }));
const submit = () => fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

/** The JSON body posted to /api/onboarding by the most recent submit */
const postedPayload = () => {
  const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, { body: string }];
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
      expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    });

    it('moves to the editor profile form after picking a role', () => {
      fireEvent.click(screen.getByRole('button', { name: /i'm an editor/i }));
      expect(screen.getByRole('heading', { level: 1, name: /your newsroom/i })).toBeInTheDocument();
      expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
    });

    it('moves to the freelancer profile form after picking a role', () => {
      fireEvent.click(screen.getByRole('button', { name: /i'm a freelancer/i }));
      expect(screen.getByRole('heading', { level: 1, name: /your reporting/i })).toBeInTheDocument();
      expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
    });
  });

  describe('Step 2: editor profile', () => {
    beforeEach(() => {
      fireEvent.click(screen.getByRole('button', { name: /i'm an editor/i }));
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

    it('can go back to change role', () => {
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
      type(/first name/i, 'Sarah');
      type(/last name/i, 'Jenkins');
      type(/work email/i, 'sarah@newsroom.example');
      type(/position \/ title/i, 'News Editor');
      fireEvent.click(chip('Politics'));
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
      fireEvent.click(screen.getByRole('button', { name: /i'm a freelancer/i }));
    });

    it('shows freelancer-only fields', () => {
      expect(screen.getByRole('heading', { name: /^beats$/i })).toBeInTheDocument();
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

    it('requires at least one beat and one medium', () => {
      next();
      expect(screen.getByText(/pick at least one beat/i)).toBeInTheDocument();
      expect(screen.getByText(/pick at least one medium/i)).toBeInTheDocument();
    });

    it('reaches the success screen with valid details', async () => {
      type(/first name/i, 'Alex');
      type(/last name/i, 'Rivera');
      type(/^email/i, 'alex@example.com');
      fireEvent.click(chip('Climate'));
      fireEvent.click(chip('Photo'));
      next();
      submit();

      expect(
        await screen.findByRole('heading', { level: 1, name: /you're all set, alex/i }, { timeout: 2000 })
      ).toBeInTheDocument();
      expect(screen.getByText(/your freelancer profile is live/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /browse assignments/i })).toHaveAttribute(
        'href',
        '/dashboard/assignments'
      );
    });
  });

  describe('Step 3: preferences', () => {
    describe('editor', () => {
      beforeEach(() => {
        fireEvent.click(screen.getByRole('button', { name: /i'm an editor/i }));
        type(/first name/i, 'Sarah');
        type(/last name/i, 'Jenkins');
        type(/work email/i, 'sarah@newsroom.example');
        type(/position \/ title/i, 'News Editor');
        fireEvent.click(chip('Politics'));
        next();
      });

      it('shows the editor preference fields only', () => {
        expect(screen.getByRole('heading', { level: 1, name: /how you work/i })).toBeInTheDocument();
        expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
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
        expect(body.role).toBe('editor');
        expect(body.profile.user.longBio).toBe('I commission accountability work.');
        expect(body.profile.user.preferences).toEqual({
          theme: 'system',
          language: 'English',
          notifications: { email: true, push: false },
        });
        expect(body.profile.pitchPreferences).toMatchObject({
          preferredPitchFormat: 'Email pitch',
          averageResponseTime: 3,
        });
        expect(body.profile.availability).toMatchObject({
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
        fireEvent.click(screen.getByRole('button', { name: /i'm a freelancer/i }));
        type(/first name/i, 'Alex');
        type(/last name/i, 'Rivera');
        type(/^email/i, 'alex@example.com');
        fireEvent.click(chip('Climate'));
        fireEvent.click(chip('Photo'));
        next();
      });

      it('shows the freelancer preference fields only', () => {
        expect(screen.getByRole('heading', { level: 1, name: /rates & availability/i })).toBeInTheDocument();
        expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
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
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('sends the rate, communities and availability with the profile', async () => {
        type(/your rate/i, '0.75');
        type(/communities you cover/i, 'South Texas');
        fireEvent.click(screen.getByRole('button', { name: 'Tuesday' }));
        submit();

        await screen.findByRole('heading', { level: 1, name: /you're all set, alex/i }, { timeout: 2000 });

        const body = postedPayload();
        expect(body.profile.rate).toBe('$0.75 / word');
        expect(body.profile.communityCovered).toBe('South Texas');
        expect(body.profile.availability).toMatchObject({ days: ['tuesday'] });
      });
    });
  });
});
