/**
 * @jest-environment node
 */
import { isPhotoKeyFor, photoKeyFor, photoKeyPrefix } from './s3';

describe('photo keys', () => {
  it('names objects under the user prefix', () => {
    expect(photoKeyPrefix('user_1')).toBe('photos/user_1/');
    expect(photoKeyFor('user_1', 'image/jpeg')).toMatch(/^photos\/user_1\/[0-9a-f-]{36}\.jpg$/);
    expect(photoKeyFor('user_1', 'image/webp')).toMatch(/^photos\/user_1\/[0-9a-f-]{36}\.webp$/);
  });

  it('accepts a key the upload route produced for that user', () => {
    expect(isPhotoKeyFor(photoKeyFor('user_1', 'image/png'), 'user_1')).toBe(true);
  });

  it("rejects another user's key or a key that points somewhere else", () => {
    const key = photoKeyFor('user_2', 'image/png');
    expect(isPhotoKeyFor(key, 'user_1')).toBe(false);
    expect(isPhotoKeyFor('photos/user_1/../user_2/x.png', 'user_1')).toBe(false);
    expect(isPhotoKeyFor('photos/user_1/', 'user_1')).toBe(false);
    expect(isPhotoKeyFor('photos/user_1/me.png', 'user_1')).toBe(false);
  });
});
