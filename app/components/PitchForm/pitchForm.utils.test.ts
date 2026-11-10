import { pitchSlug, pitchInviteEmails, validatePitch, EMPTY_PITCH } from './pitchForm.utils';
it('normalizes slugs and deduplicates invite emails', () => {
  expect(pitchSlug(' Café: Budget! ')).toBe('cafe-budget');
  expect(pitchInviteEmails('a@example.com,A@example.com')).toEqual(['a@example.com']);
});
it('rejects invalid compensation and invite addresses', () => {
  const errors = validatePitch(
    { ...EMPTY_PITCH, compensation: { amount: '-1', currency: 'USD', unit: 'flat' }, inviteEmails: 'invalid' },
    '2030-01-01'
  );
  expect(errors.compensation).toBeTruthy();
  expect(errors.inviteEmails).toBeTruthy();
});
