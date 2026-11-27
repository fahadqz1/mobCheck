import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { loadBookingFor } from '@/lib/bookings';
import { deleteFile, readImage, saveFile, UploadError } from '@/lib/storage';
import { fileUrl } from '@/lib/format';
import { serverError } from '@/lib/api';

const MAX_EVIDENCE = 20;
const ANNOTATIONS = ['SCREEN_CRACK', 'FRAME_DENT', 'CAMERA_DAMAGE', 'CHARGING_PORT', 'BACK_GLASS_CRACK', 'BUTTON_ISSUE', 'DISPLAY_LINE', 'OTHER'];

async function inspectorBooking(request: NextRequest, id: string) {
  const auth = await requireUser(request, ['INSPECTOR']);
  if (auth.response) return { response: auth.response };
  const { booking, party } = await loadBookingFor(auth.user, id);
  if (!booking || party !== 'inspector') return { response: NextResponse.json({ error: 'Booking not found' }, { status: 404 }) };
  if (booking.status !== 'INSPECTION_IN_PROGRESS') return { response: NextResponse.json({ error: 'Photos can only be changed while the inspection is in progress.' }, { status: 409 }) };
  return { booking };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const r = await inspectorBooking(request, params.id);
    if (r.response) return r.response;
    const count = await prisma.inspectionEvidence.count({ where: { bookingId: params.id } });
    if (count >= MAX_EVIDENCE) return NextResponse.json({ error: `Up to ${MAX_EVIDENCE} photos per inspection.` }, { status: 400 });

    const form = await request.formData();
    const image = await readImage(form.get('file') as File | null);
    const annotationType = String(form.get('annotationType') || '');
    const annotationText = String(form.get('annotationText') || '').slice(0, 300) || null;
    const key = await saveFile(`evidence/${params.id}`, image.buffer, image.ext);
    const evidence = await prisma.inspectionEvidence.create({
      data: {
        bookingId: params.id,
        storageKey: key,
        storageUrl: fileUrl(key),
        mimeType: image.mime,
        fileSizeBytes: image.size,
        photoSequence: count + 1,
        annotationType: ANNOTATIONS.includes(annotationType) ? (annotationType as any) : null,
        annotationText,
        takenAt: new Date(),
      },
      select: { id: true, storageKey: true, annotationType: true, annotationText: true },
    });
    return NextResponse.json({ data: { ...evidence, url: fileUrl(evidence.storageKey) } }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    return serverError('Upload evidence error', error, 'Could not upload the photo.');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const r = await inspectorBooking(request, params.id);
    if (r.response) return r.response;
    const evidenceId = request.nextUrl.searchParams.get('evidenceId') || '';
    const evidence = await prisma.inspectionEvidence.findUnique({ where: { id: evidenceId } });
    if (!evidence || evidence.bookingId !== params.id) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    await prisma.inspectionEvidence.delete({ where: { id: evidence.id } });
    await deleteFile(evidence.storageKey).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Delete evidence error', error);
  }
}
