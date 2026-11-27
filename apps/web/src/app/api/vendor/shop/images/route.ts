import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { deleteFile, readImage, saveFile, UploadError } from '@/lib/storage';
import { fileUrl } from '@/lib/format';
import { serverError } from '@/lib/api';

const MAX_GALLERY = 8;

async function ownShop(request: NextRequest) {
  const auth = await requireUser(request, ['SHOP_OWNER']);
  if (auth.response) return { response: auth.response };
  const shop = await prisma.shop.findFirst({ where: { ownerId: auth.user.id }, select: { id: true, logoUrl: true, coverUrl: true, galleryUrls: true } });
  if (!shop) return { response: NextResponse.json({ error: 'Register your shop first.' }, { status: 404 }) };
  return { shop };
}

// form fields: kind = logo | cover | gallery, file
export async function POST(request: NextRequest) {
  try {
    const r = await ownShop(request);
    if (r.response) return r.response;
    const form = await request.formData();
    const kind = form.get('kind');
    if (kind !== 'logo' && kind !== 'cover' && kind !== 'gallery') return NextResponse.json({ error: 'Unknown image type' }, { status: 400 });
    if (kind === 'gallery' && r.shop.galleryUrls.length >= MAX_GALLERY) return NextResponse.json({ error: `The gallery holds up to ${MAX_GALLERY} photos.` }, { status: 400 });

    const image = await readImage(form.get('file') as File | null);
    const key = await saveFile(`shops/${r.shop.id}`, image.buffer, image.ext);
    if (kind === 'gallery') {
      await prisma.shop.update({ where: { id: r.shop.id }, data: { galleryUrls: { push: key } } });
    } else {
      const previous = kind === 'logo' ? r.shop.logoUrl : r.shop.coverUrl;
      await prisma.shop.update({ where: { id: r.shop.id }, data: kind === 'logo' ? { logoUrl: key } : { coverUrl: key } });
      if (previous) await deleteFile(previous).catch(() => {});
    }
    return NextResponse.json({ data: { key, url: fileUrl(key) } }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    return serverError('Shop image upload error', error, 'Could not upload the image.');
  }
}

// body: { kind: 'logo' | 'cover' | 'gallery', key? }
export async function DELETE(request: NextRequest) {
  try {
    const r = await ownShop(request);
    if (r.response) return r.response;
    const { kind, key } = await request.json().catch(() => ({}));
    if (kind === 'gallery') {
      if (!r.shop.galleryUrls.includes(key)) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
      await prisma.shop.update({ where: { id: r.shop.id }, data: { galleryUrls: r.shop.galleryUrls.filter((k) => k !== key) } });
      await deleteFile(key).catch(() => {});
    } else if (kind === 'logo' || kind === 'cover') {
      const previous = kind === 'logo' ? r.shop.logoUrl : r.shop.coverUrl;
      await prisma.shop.update({ where: { id: r.shop.id }, data: kind === 'logo' ? { logoUrl: null } : { coverUrl: null } });
      if (previous) await deleteFile(previous).catch(() => {});
    } else {
      return NextResponse.json({ error: 'Unknown image type' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Shop image delete error', error);
  }
}
