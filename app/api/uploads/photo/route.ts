import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { photoFileProblem, sniffPhotoType } from '../../../utils/photo.utils';
import { getSignedPhotoUrl, isPhotoStorageConfigured, photoKeyFor, putPhoto } from '../../../../lib/s3';

export const runtime = 'nodejs';

/** `File` is a global in Node, but the guard keeps a malformed form from being cast blindly */
const isUploadedFile = (value: FormDataEntryValue | null): value is File =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as File).arrayBuffer === 'function' &&
  typeof (value as File).size === 'number';

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to upload a photo.' }, { status: 401 });
  }

  if (!isPhotoStorageConfigured()) {
    return NextResponse.json({ error: 'Photo uploads are not configured.' }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'The upload could not be read.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!isUploadedFile(file) || file.size === 0) {
    return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });
  }

  const problem = photoFileProblem(file);
  if (problem) {
    return NextResponse.json({ error: problem }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = sniffPhotoType(bytes);

  // The declared type is only a hint; a renamed file must not be stored as an image
  if (!contentType || contentType !== file.type) {
    return NextResponse.json({ error: 'Upload a JPEG, PNG or WebP image.' }, { status: 400 });
  }

  const key = photoKeyFor(userId, contentType);

  try {
    await putPhoto(key, bytes, contentType);
    const url = await getSignedPhotoUrl(key);
    return NextResponse.json({ key, url }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload the profile photo.', error);
    return NextResponse.json({ error: 'Unable to upload your photo right now.' }, { status: 500 });
  }
}
