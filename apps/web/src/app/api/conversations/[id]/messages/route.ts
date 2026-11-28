import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { serverError } from '@/lib/api';
import { loadParticipantConversation } from '@/lib/chat';
import { CONTACT_WARNING, detectContact } from '@/lib/contact-detect';
import { readImage, saveFile, UploadError } from '@/lib/storage';
import { watermarkPhoto } from '@/lib/watermark';
import { classifyChatImage } from '@/lib/ai';
import { fileUrl, fullName } from '@/lib/format';
import { notify } from '@/lib/notify';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

type Row = { id: string; senderId: string; body: string | null; imageKey: string | null; status: string; moderationNote: string | null; createdAt: Date };

const view = (m: Row, userId: string) => ({
  id: m.id,
  mine: m.senderId === userId,
  body: m.body,
  imageUrl: m.imageKey && (m.status === 'DELIVERED' || m.senderId === userId) ? fileUrl(m.imageKey) : null,
  status: m.status,
  note: m.senderId === userId ? m.moderationNote : null,
  createdAt: m.createdAt.toISOString(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const found = await loadParticipantConversation(auth.user, params.id);
    if (!found) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    // Other people's blocked or unreviewed messages are never shown.
    const messages = await prisma.message.findMany({
      where: { conversationId: params.id, OR: [{ status: 'DELIVERED' }, { senderId: auth.user.id }] },
      orderBy: { createdAt: 'asc' },
      take: 300,
    });
    if (found.side !== 'admin') {
      await prisma.conversation.update({ where: { id: params.id }, data: found.side === 'starter' ? { starterReadAt: new Date() } : { recipientReadAt: new Date() } });
    }
    return NextResponse.json({ messages: messages.map((m) => view(m, auth.user.id)) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return serverError('Get messages error', error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const found = await loadParticipantConversation(auth.user, params.id);
    if (!found || found.side === 'admin') return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    if (!rateLimit(`chat:${auth.user.id}`, 60, 10 * 60 * 1000).ok) {
      return NextResponse.json({ error: 'You are sending messages too quickly. Please wait a moment.' }, { status: 429 });
    }
    const c = found.conversation;

    let body = '';
    let file: File | null = null;
    if ((request.headers.get('content-type') || '').includes('multipart/form-data')) {
      const form = await request.formData();
      body = String(form.get('body') || '');
      file = form.get('file') as File | null;
    } else {
      body = String((await request.json().catch(() => ({})))?.body || '');
    }
    body = body.trim().slice(0, 2000);
    if (!body && !file) return NextResponse.json({ error: 'Write a message or attach a photo.' }, { status: 400 });

    const contact = detectContact(body);
    if (contact) {
      const blocked = await prisma.message.create({
        data: { conversationId: c.id, senderId: auth.user.id, body, status: 'BLOCKED', moderationNote: `Not sent: contains ${contact.reason}.` },
      });
      return NextResponse.json({ error: CONTACT_WARNING, blocked: true, message: view(blocked, auth.user.id) }, { status: 422 });
    }

    let imageKey: string | null = null;
    let status: 'DELIVERED' | 'PENDING_REVIEW' | 'BLOCKED' = 'DELIVERED';
    let note: string | null = null;
    if (file) {
      const original = await readImage(file);
      const verdict = await classifyChatImage(original.buffer, original.mime as 'image/jpeg' | 'image/png' | 'image/webp');
      if (verdict.verdict === 'contact' || verdict.verdict === 'not_phone') {
        const blocked = await prisma.message.create({
          data: {
            conversationId: c.id,
            senderId: auth.user.id,
            body: body || null,
            status: 'BLOCKED',
            moderationNote: verdict.verdict === 'contact' ? 'Photo not sent: it shows contact details.' : 'Photo not sent: only photos of the phone, its box or accessories are allowed.',
          },
        });
        const warning = verdict.verdict === 'contact' ? CONTACT_WARNING : 'Only photos of the phone, its box, accessories or screens can be shared in MobCheck chats.';
        return NextResponse.json({ error: warning, blocked: true, message: view(blocked, auth.user.id) }, { status: 422 });
      }
      const marked = await watermarkPhoto(original.buffer);
      imageKey = await saveFile(`chat/${c.id}`, marked.buffer, marked.ext);
      if (verdict.verdict === 'unknown') {
        status = 'PENDING_REVIEW';
        note = 'Photo is waiting for a quick safety check before the other person can see it.';
      }
    }

    const message = await prisma.message.create({ data: { conversationId: c.id, senderId: auth.user.id, body: body || null, imageKey, status, moderationNote: note } });
    if (status === 'DELIVERED') {
      const recipientId = c.starterId === auth.user.id ? c.recipientId : c.starterId;
      const recipientRead = c.starterId === auth.user.id ? c.recipientReadAt : c.starterReadAt;
      await prisma.conversation.update({
        where: { id: c.id },
        data: { lastMessageAt: message.createdAt, ...(found.side === 'starter' ? { starterReadAt: new Date() } : { recipientReadAt: new Date() }) },
      });
      // One notification per unread burst, not one per message.
      if (!recipientRead || recipientRead >= c.lastMessageAt) {
        await notify(recipientId, `New message from ${fullName(auth.user)}`, imageKey ? 'Sent a photo' : body.slice(0, 120), `/messages?c=${c.id}`);
      }
    }
    return NextResponse.json({ message: view(message, auth.user.id) }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 400 });
    return serverError('Send message error', error, 'Your message could not be sent.');
  }
}
