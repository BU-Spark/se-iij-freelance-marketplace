import { fireEvent, render, screen } from '@testing-library/react';
import { useAuth } from '@clerk/nextjs';
import { PitchComposer } from './PitchComposer';
import { pitchSlug, pitchInviteEmails, validatePitch, EMPTY_PITCH } from './pitchForm.utils';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));
const auth = jest.mocked(useAuth);
const account = (userId: string) => auth.mockReturnValue({ userId, isLoaded: true } as ReturnType<typeof useAuth>);
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  localStorage.clear();
  account('user-a');
});
afterEach(() => jest.restoreAllMocks());

it('generates stable slugs and validates structured compensation and invites', () => {
  expect(pitchSlug('  Café: City Budget! ')).toBe('cafe-city-budget');
  expect(pitchInviteEmails('a@example.com, A@example.com; b@example.com')).toEqual(['a@example.com', 'b@example.com']);
  const errors = validatePitch(
    {
      ...EMPTY_PITCH,
      deadline: '2020-01-01',
      inviteEmails: 'bad-email',
      compensation: { amount: '-5', currency: 'USD', unit: 'word' },
    },
    '2030-01-01'
  );
  expect(errors.compensation).toBeTruthy();
  expect(errors.inviteEmails).toBeTruthy();
  expect(errors.deadline).toBeTruthy();
});

it('validates, reviews a pitch, preserves edits, and saves without sending', () => {
  render(<PitchComposer />);
  fireEvent.click(screen.getByRole('button', { name: 'Review pitch' }));
  expect(screen.getByRole('alert')).toHaveTextContent('correct the highlighted fields');
  // Error text is associated separately, keeping the input names stable.
  change('Pitch title', 'City budget investigation');
  change('Recipient editor email', 'editor@example.com');
  change('Category', 'Politics');
  change('Summary', 'Follow the money');
  change('Story angle and reporting plan', 'Interview residents and examine public records.');
  change('Location', 'Remote');
  change('Proposed length or duration', '1200 words');
  change('Proposed delivery date', '2099-12-01');
  change('Amount', '0.75');
  change('Rate basis', 'word');
  change('Collaborator emails (optional)', 'partner@example.com');
  expect(screen.getByLabelText(/Generated slug/)).toHaveValue('city-budget-investigation');
  fireEvent.click(screen.getByRole('button', { name: 'Review pitch' }));
  expect(screen.getByRole('region', { name: 'Pitch preview' })).toBeInTheDocument();
  expect(screen.getByText('USD 0.75 / word')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Submit pitch' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Back to editing' }));
  expect(screen.getByLabelText('Pitch title')).toHaveValue('City budget investigation');
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(screen.getByRole('status')).toHaveTextContent('No pitch or invitations have been sent');
});

it('restores partial drafts and isolates signed-in accounts', () => {
  const view = render(<PitchComposer />);
  change('Pitch title', 'My unfinished idea');
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  view.unmount();
  const restored = render(<PitchComposer />);
  expect(screen.getByLabelText('Pitch title')).toHaveValue('My unfinished idea');
  account('user-b');
  restored.rerender(<PitchComposer />);
  expect(screen.getByLabelText('Pitch title')).toHaveValue('');
});

it('handles damaged drafts and blocked storage', () => {
  localStorage.setItem('iij:pitch-draft:user-a', '{bad');
  render(<PitchComposer />);
  expect(screen.getByRole('alert')).toHaveTextContent('could not be loaded');
  change('Pitch title', 'Retained in form');
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Blocked');
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to save');
  expect(screen.getByLabelText('Pitch title')).toHaveValue('Retained in form');
});
