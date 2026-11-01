/**
 * photo.utils.ts
 *
 * Rules for the profile photo uploaded during onboarding. Kept client-safe so the
 * photo picker and the upload route enforce exactly the same limits.
 */

/** Small enough to relay through a Route Handler without streaming to S3 */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const PHOTO_MAX_LABEL = '5 MB';

/** Formats every current browser can render */
export const PHOTO_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type PhotoContentType = (typeof PHOTO_CONTENT_TYPES)[number];

/** For the file input's `accept` attribute */
export const PHOTO_ACCEPT = PHOTO_CONTENT_TYPES.join(',');

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  bytes.length >= offset + signature.length && signature.every((byte, index) => bytes[offset + index] === byte);

/** The real type of the image, read from its file signature so a renamed file can't sneak through */
export function sniffPhotoType(bytes: Uint8Array): PhotoContentType | null {
  if (startsWith(bytes, JPEG_SIGNATURE)) return 'image/jpeg';
  if (startsWith(bytes, PNG_SIGNATURE)) return 'image/png';
  if (startsWith(bytes, RIFF_SIGNATURE) && startsWith(bytes, WEBP_SIGNATURE, 8)) return 'image/webp';
  return null;
}

export const isPhotoContentType = (type: string): type is PhotoContentType =>
  (PHOTO_CONTENT_TYPES as readonly string[]).includes(type);

/** The same rules the route enforces, so a bad file is reported before it is uploaded */
export function photoFileProblem(file: { type: string; size: number }): string | null {
  if (!isPhotoContentType(file.type)) return 'Upload a JPEG, PNG or WebP image.';
  if (file.size === 0) return 'That image is empty.';
  if (file.size > PHOTO_MAX_BYTES) return `Keep the image under ${PHOTO_MAX_LABEL}.`;
  return null;
}
