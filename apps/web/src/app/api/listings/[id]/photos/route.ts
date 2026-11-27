import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { readImage, saveFile, UploadError } from '@/lib/storage';
import { fileUrl } from '@/lib/format';
import { serverError } from '@/lib/api';

const MAX_PHOTOS = 10;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const listing = await prisma.phoneListing.findUnique({ where: { id: params.id }, select: { id: true, userId: true, _count: { select: { photos: true } } } });
    if (!listing || listing.userId !== auth.user.id) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    if (listing._count.photos >= MAX_PHOTOS) return NextResponse.json({ error: `A listing can have up to ${MAX_PHOTOS} photos.` }, { status: 400 });

    const form = await request.formData();
    const image = await readImage(form.get('file') as File | null);
    const key = await saveFile(`listings/${listing.id}`, image.buffer, image.ext);
    const photo = await prisma.listingPhoto.create({
      data: {
        listingId: listing.id,
        storageKey: key,
        storageUrl: fileUrl(key),
        mimeType: image.mime,
        fileSizeBytes: image.size,
        uploadSequence: listing._count.photos + 1,
        isPrimary: listing._count.photos === 0,
      },
      select: { id: true, storageKey: true, isPrimary: true, uploadSequence: true },
    });
    return NextResponse.json({ data: { ...photo, url: fileUrl(photo.storageKey) } }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    return serverError('Upload listing photo error', error, 'Could not upload the photo.');
  }
}
