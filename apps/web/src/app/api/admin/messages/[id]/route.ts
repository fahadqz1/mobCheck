import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { parseBody, serverError } from '@/lib/api';
import { deleteFile } from '@/lib/storage';
import { notify } from '@/lib/notify';

const Schema = z.object({ decision: z.enum(['approve', 'reject']) });

// Manual review of chat photos the automatic check could not decide on.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(request, ['SUPER_ADMIN', 'OPS_ADMIN', 'SUPPORT']);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, Schema);
    if (parsed.response) return parsed.response;
    const m = await prisma.message.findUnique({ where: { id: params.id }, include: { conversation: true } });
    if (!m || m.status !== 'PENDING_REVIEW') return NextResponse.json({ error: 'Nothing to review for this message.' }, { status: 404 });

    if (parsed.data.decision === 'approve') {
      await prisma.$transaction([
        prisma.message.update({ where: { id: m.id }, data: { status: 'DELIVERED', moderationNote: null, reviewedById: auth.user.id, reviewedAt: new Date() } }),
        prisma.conversation.update({ where: { id: m.conversationId }, data: { lastMessageAt: new Date() } }),
      ]);
      const recipientId = m.conversation.starterId === m.senderId ? m.conversation.recipientId : m.conversation.starterId;
      await notify(recipientId, 'You have a new photo in your chat', undefined, `/messages?c=${m.conversationId}`);
    } else {
      await prisma.message.update({
        where: { id: m.id },
        data: { status: 'REJECTED', imageKey: null, moderationNote: 'Photo not sent: only photos of the phone, its box or accessories are allowed, with no contact details.', reviewedById: auth.user.id, reviewedAt: new Date() },
      });
      if (m.imageKey) await deleteFile(m.imageKey).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Review message error', error);
  }
}
