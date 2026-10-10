import { fireEvent, render, screen } from '@testing-library/react';
import OnboardingPage from './page';

// jsdom doesn't implement scrollTo, and the page calls it when changing steps
beforeAll(() => {
  window.scrollTo = jest.fn();
});

const chip = (label: string) => screen.getByRole('button', { name: new RegExp(`^[+✓]\\s*${label}$`, 'i') });

const type = (label: RegExp, value: string) => {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};

const submit = () => fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

describe('Onboarding page', () => {
  beforeEach(() => {
    render(<OnboardingPage />);
  });

  describe('Step 1: role picker', () => {
    it('renders the welcome heading and both role options', () => {
      expect(screen.getByRole('heading', { level: 1, name: /welcome aboard/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /i'm an editor/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /i'm a freelancer/i })).toBeInTheDocument();
      expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();
    });

    it('moves to the profile form after picking a role', () => {
      fireEvent.click(screen.getByRole('button', { name: /i'm an editor/i }));
      expect(screen.getByRole('heading', { level: 1, name: /build your profile/i })).toBeInTheDocument();
      expect(screen.getByText(/step 2 of 2/i)).toBeInTheDocument();
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
    });

    it('shows validation errors when submitted empty', () => {
      submit();
      expect(screen.getByText(/please enter your full name/i)).toBeInTheDocument();
      expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/what's your position\?/i)).toBeInTheDocument();
      expect(screen.getByText(/pick at least one desk/i)).toBeInTheDocument();
      // still on the profile step
      expect(screen.getByRole('heading', { level: 1, name: /build your profile/i })).toBeInTheDocument();
    });

    it('updates the live preview as the user types', () => {
      type(/full name/i, 'Sarah Jenkins');
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
      type(/full name/i, 'Sarah Jenkins');
      type(/work email/i, 'sarah@newsroom.example');
      type(/position \/ title/i, 'News Editor');
      fireEvent.click(chip('Politics'));
      submit();

      expect(
        await screen.findByRole('heading', { level: 1, name: /you're all set, sarah/i }, { timeout: 2000 })
      ).toBeInTheDocument();
      expect(screen.getByText(/your editor profile is live/i)).toBeInTheDocument();
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
    });

    it('rejects a portfolio link without http(s)', () => {
      type(/portfolio link/i, 'myportfolio.com');
      expect(screen.getByText(/link should start with http:\/\/ or https:\/\//i)).toBeInTheDocument();
    });

    it('requires at least one beat and one medium', () => {
      submit();
      expect(screen.getByText(/pick at least one beat/i)).toBeInTheDocument();
      expect(screen.getByText(/pick at least one medium/i)).toBeInTheDocument();
    });

    it('reaches the success screen with valid details', async () => {
      type(/full name/i, 'Alex Rivera');
      type(/^email/i, 'alex@example.com');
      fireEvent.click(chip('Climate'));
      fireEvent.click(chip('Photo'));
      submit();

      expect(
        await screen.findByRole('heading', { level: 1, name: /you're all set, alex/i }, { timeout: 2000 })
      ).toBeInTheDocument();
      expect(screen.getByText(/your freelancer profile is live/i)).toBeInTheDocument();
    });
  });
});
