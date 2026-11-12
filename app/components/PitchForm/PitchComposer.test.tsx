import { fireEvent, render, screen } from '@testing-library/react';
import { useAuth } from '@clerk/nextjs';
import { PitchComposer } from './PitchComposer';
import { pitchSlug, pitchInviteEmails, validatePitch, EMPTY_PITCH } from './pitchForm.utils';

jest.mock('@clerk/nextjs', () => ({ useAuth: jest.fn() }));
const auth = jest.mocked(useAuth);
const account = (userId: string) => auth.mockReturnValue({ userId, isLoaded: true } as ReturnType<typeof useAuth>);
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

/** Fills every field the composer needs before a send can reach the API */
const fillValidDraft = () => {
  change('Pitch title', 'City budget investigation');
  change('Recipient editor email', 'editor@example.com');
  fireEvent.click(screen.getByRole('button', { name: /Politics/ }));
  change('Summary', 'Follow the money');
  change('Story angle and reporting plan', 'Interview residents and examine public records.');
  change('Location', 'Remote');
  change('Proposed length or duration', '1200 words');
  change('Proposed delivery date', '2099-12-01');
  change('Proposed compensation', '0.75');
};

/** Stubs the pitches API with a fixed response */
const respond = (status: number, body: unknown) => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

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

it('validates the pitch, sends it, and forgets the saved draft', async () => {
  render(<PitchComposer />);
  fireEvent.click(screen.getByRole('button', { name: 'Send pitch' }));
  expect(screen.getByRole('alert')).toHaveTextContent('correct the highlighted fields');
  // Error text is associated separately, keeping the input names stable.
  fillValidDraft();
  expect(screen.queryByLabelText(/slug/i)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Politics/ })).toHaveAttribute('aria-pressed', 'true');

  const fetchMock = respond(201, { pitch: { id: 'pitch-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send pitch' }));

  expect(await screen.findByRole('status')).toHaveTextContent('Pitch sent');
  expect(fetchMock).toHaveBeenCalledWith('/api/pitches', expect.objectContaining({ method: 'POST' }));
  // the draft is only forgotten once the API has it
  expect(localStorage.getItem('iij:pitch-draft:user-a')).toBeNull();
  expect(screen.getByLabelText('Pitch title')).toHaveValue('City budget investigation');
});

it('shows the field errors the API reports', async () => {
  render(<PitchComposer />);
  fillValidDraft();
  respond(400, {
    error: 'We could not find an editor with that email.',
    errors: { editorEmail: 'We could not find an editor with that email.' },
  });

  fireEvent.click(screen.getByRole('button', { name: 'Send pitch' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not find an editor/i);
  expect(screen.getByLabelText('Recipient editor email')).toHaveAttribute('aria-invalid', 'true');
  // the draft survives a failed send
  expect(localStorage.getItem('iij:pitch-draft:user-a')).not.toBeNull();
});

it('says when the same pitch was already sent to that editor', async () => {
  render(<PitchComposer />);
  fillValidDraft();
  respond(409, { error: 'You have already sent this pitch to that editor.' });

  fireEvent.click(screen.getByRole('button', { name: 'Send pitch' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/already sent/i);
});

it('restores partial drafts and isolates signed-in accounts', () => {
  const view = render(<PitchComposer />);
  change('Pitch title', 'My unfinished idea');
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
  change('Pitch title', 'Retained in form!');
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to save');
  expect(screen.getByLabelText('Pitch title')).toHaveValue('Retained in form!');
});
