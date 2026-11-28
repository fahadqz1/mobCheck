import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { parseBody, serverError } from '@/lib/api';
import { ChatError, conversationListInclude, startConversation, summarise } from '@/lib/chat';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const rows = await prisma.conversation.findMany({
      where: { OR: [{ starterId: auth.user.id }, { recipientId: auth.user.id }] },
      include: conversationListInclude,
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
    const items = rows.map((r) => summarise(r, auth.user.id));
    return NextResponse.json({ items, unread: items.filter((i) => i.unread).length }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return serverError('List conversations error', error);
  }
}

const StartSchema = z.object({ kind: z.enum(['LISTING', 'SHOP', 'BOOKING']), refId: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (auth.response) return auth.response;
    const parsed = await parseBody(request, StartSchema);
    if (parsed.response) return parsed.response;
    const conversation = await startConversation(auth.user, parsed.data.kind, parsed.data.refId);
    return NextResponse.json({ data: conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof ChatError) return NextResponse.json({ error: error.message }, { status: error.status });
    return serverError('Start conversation error', error);
  }
}
