import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { deleteFile } from '@/lib/storage';
import { serverError } from '@/lib/api';

async function ownPhoto(request: NextRequest, listingId: string, photoId: string) {
  const auth = await requireUser(request);
  if (auth.response) return { response: auth.response };
  const photo = await prisma.listingPhoto.findUnique({ where: { id: photoId }, include: { listing: { select: { userId: true } } } });
  if (!photo || photo.listingId !== listingId || photo.listing.userId !== auth.user.id) {
    return { response: NextResponse.json({ error: 'Photo not found' }, { status: 404 }) };
  }
  return { photo };
}

// Makes this photo the cover image.
export async function PATCH(request: NextRequest, { params }: { params: { id: string; photoId: string } }) {
  try {
    const r = await ownPhoto(request, params.id, params.photoId);
    if (r.response) return r.response;
    await prisma.$transaction([
      prisma.listingPhoto.updateMany({ where: { listingId: params.id }, data: { isPrimary: false } }),
      prisma.listingPhoto.update({ where: { id: params.photoId }, data: { isPrimary: true } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Set cover photo error', error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; photoId: string } }) {
  try {
    const r = await ownPhoto(request, params.id, params.photoId);
    if (r.response) return r.response;
    await prisma.listingPhoto.delete({ where: { id: params.photoId } });
    await deleteFile(r.photo.storageKey).catch(() => {});
    if (r.photo.isPrimary) {
      const next = await prisma.listingPhoto.findFirst({ where: { listingId: params.id }, orderBy: { uploadSequence: 'asc' } });
      if (next) await prisma.listingPhoto.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Delete photo error', error);
  }
}
