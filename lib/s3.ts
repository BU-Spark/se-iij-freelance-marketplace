import { randomUUID } from 'node:crypto';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PhotoContentType } from '../app/utils/photo.utils';

/**
 * Server-only S3 access for profile photos.
 *
 * The bucket is private, so only the object key is stored in PostgreSQL; every
 * render signs a short-lived GET URL. Objects live under `<prefix>/<clerk user id>/`
 * so a user can only ever reference their own upload.
 */

export const PHOTO_KEY_PREFIX = 'photos';

const EXTENSIONS: Record<PhotoContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const DEFAULT_URL_TTL_SECONDS = 60 * 60;

/**
 * Names follow the Railway bucket variables (`railway bucket credentials`), with the
 * generic S3 names accepted as a fallback for other hosts.
 */
const bucket = () => process.env.AWS_S3_BUCKET_NAME ?? process.env.S3_BUCKET_NAME;

const region = () => process.env.AWS_DEFAULT_REGION ?? process.env.AWS_REGION ?? 'us-east-1';

const endpoint = () => process.env.AWS_ENDPOINT_URL ?? process.env.S3_ENDPOINT;

/** Credentials come from the standard AWS chain; without a bucket there is nowhere to upload */
export const isPhotoStorageConfigured = () => Boolean(bucket());

let client: S3Client | undefined;

const s3 = (): S3Client => {
  const url = endpoint();
  client ??= new S3Client({
    region: region(),
    // Railway buckets are virtual-hosted; LocalStack/MinIO want bucket names in the path
    ...(url ? { endpoint: url, forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' } : {}),
  });
  return client;
};

const photoPrefix = () => process.env.S3_PHOTO_PREFIX || PHOTO_KEY_PREFIX;

export const photoKeyPrefix = (userId: string) => `${photoPrefix()}/${userId}/`;

const PHOTO_FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export const photoKeyFor = (userId: string, contentType: PhotoContentType) =>
  `${photoKeyPrefix(userId)}${randomUUID()}.${EXTENSIONS[contentType]}`;

/** True only for a key this user's own upload could have produced, so a submitted key can't point elsewhere */
export const isPhotoKeyFor = (key: string, userId: string): boolean => {
  const prefix = photoKeyPrefix(userId);
  return key.startsWith(prefix) && PHOTO_FILE_NAME.test(key.slice(prefix.length));
};

export async function putPhoto(key: string, body: Uint8Array, contentType: PhotoContentType): Promise<void> {
  const name = bucket();
  if (!name) throw new Error('AWS_S3_BUCKET_NAME is not set.');

  await s3().send(
    new PutObjectCommand({
      Bucket: name,
      Key: key,
      Body: body,
      ContentType: contentType,
      // The object is reachable only through a signed URL, so shared caches must not keep it
      CacheControl: 'private, max-age=3600',
    })
  );
}

const urlTtlSeconds = () => {
  const configured = Number(process.env.S3_PHOTO_URL_TTL_SECONDS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_URL_TTL_SECONDS;
};

export async function getSignedPhotoUrl(key: string): Promise<string> {
  const name = bucket();
  if (!name) throw new Error('AWS_S3_BUCKET_NAME is not set.');

  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: name, Key: key }), { expiresIn: urlTtlSeconds() });
}
