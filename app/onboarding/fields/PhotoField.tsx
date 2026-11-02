'use client';

import { useId, useState } from 'react';
import styles from './PhotoField.module.css';
import { PHOTO_ACCEPT, PHOTO_MAX_LABEL, photoFileProblem } from '../../utils/photo.utils';
import type { ProfileData, ProfileUpdate } from '../../types/onboarding.types';

type PhotoFieldProps = {
  data: ProfileData;
  update: ProfileUpdate;
};

type UploadResponse = { key?: unknown; url?: unknown };

const UPLOAD_FAILED = 'Unable to upload your photo right now.';

/** Reads the `{ error }` body the upload route returns for a rejected file */
const errorMessage = (body: unknown, fallback: string) =>
  body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : fallback;

/** Uploads the picked file straight away, so the profile is saved with an S3 key, not an in-flight file */
export default function PhotoField({ data, update }: PhotoFieldProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;

    const problem = photoFileProblem(file);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch('/api/uploads/photo', { method: 'POST', body });
      const result: unknown = await response.json().catch(() => null);

      if (!response.ok) throw new Error(errorMessage(result, UPLOAD_FAILED));

      const { key, url } = (result ?? {}) as UploadResponse;
      if (typeof key !== 'string' || typeof url !== 'string') throw new Error(UPLOAD_FAILED);

      update('photoKey', key);
      update('photoUrl', url);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : UPLOAD_FAILED);
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    setError(null);
    update('photoKey', '');
    update('photoUrl', '');
  };

  return (
    <div className={styles.photo}>
      <div className={styles.tile}>
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed S3 URLs expire, so the optimizer must not cache them
          <img src={data.photoUrl} alt="Your profile photo" className={styles.image} />
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="34"
            height="34"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="8.5" r="3.5" />
            <path d="M4.8 20c.9-3.6 3.8-5.8 7.2-5.8s6.3 2.2 7.2 5.8" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <div className={styles.controls}>
        <p className={styles.label}>Profile photo</p>
        <p className={styles.hint}>JPEG, PNG or WebP, up to {PHOTO_MAX_LABEL}.</p>

        <div className={styles.buttons}>
          <label htmlFor={inputId} className={styles.uploadBtn} data-uploading={uploading}>
            {uploading ? 'Uploading…' : data.photoUrl ? 'Change photo' : 'Add photo'}
          </label>
          <input
            id={inputId}
            type="file"
            accept={PHOTO_ACCEPT}
            className={styles.input}
            disabled={uploading}
            onChange={(event) => {
              void upload(event.target.files?.[0]);
              // Let the same file be picked again after a failure
              event.target.value = '';
            }}
          />
          {data.photoUrl && !uploading && (
            <button type="button" className={styles.removeBtn} onClick={remove}>
              Remove
            </button>
          )}
        </div>

        {uploading && (
          <p className={styles.status} role="status">
            Uploading your photo…
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
