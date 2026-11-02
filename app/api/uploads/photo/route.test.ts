/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { getSignedPhotoUrl, isPhotoStorageConfigured, photoKeyFor, putPhoto } from '../../../../lib/s3';
import { POST } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../lib/s3', () => ({
  isPhotoStorageConfigured: jest.fn(),
  photoKeyFor: jest.fn(),
  putPhoto: jest.fn(),
  getSignedPhotoUrl: jest.fn(),
}));

const authMock = auth as unknown as jest.Mock;
const configuredMock = isPhotoStorageConfigured as jest.Mock;
const keyMock = photoKeyFor as jest.Mock;
const putMock = putPhoto as jest.Mock;
const signedUrlMock = getSignedPhotoUrl as jest.Mock;

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

const upload = (body: FormData | string) => new Request('http://localhost/api/uploads/photo', { method: 'POST', body });

const imageForm = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return form;
};

describe('POST /api/uploads/photo', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    configuredMock.mockReturnValue(true);
    keyMock.mockReturnValue('photos/clerk-1/photo.png');
    signedUrlMock.mockResolvedValue('https://bucket.example/photos/clerk-1/photo.png?signed');
  });

  it('rejects anonymous requests', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await POST(upload(imageForm(new File([PNG], 'me.png', { type: 'image/png' }))));

    expect(response.status).toBe(401);
    expect(putMock).not.toHaveBeenCalled();
  });

  it('reports unconfigured storage instead of failing on a missing bucket', async () => {
    configuredMock.mockReturnValue(false);

    const response = await POST(upload(imageForm(new File([PNG], 'me.png', { type: 'image/png' }))));

    expect(response.status).toBe(503);
  });

  it('requires a file in the form', async () => {
    const response = await POST(upload(new FormData()));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/choose an image/i);
  });

  it('rejects an unsupported file type', async () => {
    const response = await POST(upload(imageForm(new File([PNG], 'notes.txt', { type: 'text/plain' }))));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/jpeg, png or webp/i);
    expect(putMock).not.toHaveBeenCalled();
  });

  it('rejects a renamed file whose bytes are not an image', async () => {
    const file = new File(['<html></html>'], 'me.png', { type: 'image/png' });

    const response = await POST(upload(imageForm(file)));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/jpeg, png or webp/i);
    expect(putMock).not.toHaveBeenCalled();
  });

  it('stores the image under the caller and returns a signed URL', async () => {
    const file = new File([PNG], 'me.png', { type: 'image/png' });

    const response = await POST(upload(imageForm(file)));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      key: 'photos/clerk-1/photo.png',
      url: 'https://bucket.example/photos/clerk-1/photo.png?signed',
    });
    expect(keyMock).toHaveBeenCalledWith('clerk-1', 'image/png');
    expect(putMock).toHaveBeenCalledWith('photos/clerk-1/photo.png', PNG, 'image/png');
  });

  it('returns 500 when the upload fails', async () => {
    putMock.mockRejectedValue(new Error('S3 is down'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(upload(imageForm(new File([PNG], 'me.png', { type: 'image/png' }))));

    expect(response.status).toBe(500);
    expect((await response.json()).error).toMatch(/unable to upload/i);
  });
});
