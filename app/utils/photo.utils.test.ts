import { PHOTO_MAX_BYTES, photoFileProblem, sniffPhotoType } from './photo.utils';

const bytes = (...values: number[]) => new Uint8Array(values);

const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00);
const WEBP = bytes(0x52, 0x49, 0x46, 0x46, 0x20, 0x20, 0x20, 0x20, 0x57, 0x45, 0x42, 0x50);

describe('sniffPhotoType', () => {
  it('recognises the formats uploads accept', () => {
    expect(sniffPhotoType(JPEG)).toBe('image/jpeg');
    expect(sniffPhotoType(PNG)).toBe('image/png');
    expect(sniffPhotoType(WEBP)).toBe('image/webp');
  });

  it('rejects anything that is not a supported image', () => {
    expect(sniffPhotoType(bytes(0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e))).toBeNull();
    expect(sniffPhotoType(bytes(0x52, 0x49, 0x46, 0x46))).toBeNull();
    expect(sniffPhotoType(new Uint8Array())).toBeNull();
  });
});

describe('photoFileProblem', () => {
  it('accepts a supported image within the size limit', () => {
    expect(photoFileProblem({ type: 'image/png', size: 2048 })).toBeNull();
  });

  it('rejects unsupported, empty and oversized files', () => {
    expect(photoFileProblem({ type: 'image/gif', size: 2048 })).toMatch(/jpeg, png or webp/i);
    expect(photoFileProblem({ type: 'image/png', size: 0 })).toMatch(/empty/i);
    expect(photoFileProblem({ type: 'image/png', size: PHOTO_MAX_BYTES + 1 })).toMatch(/under 5 MB/i);
  });
});
