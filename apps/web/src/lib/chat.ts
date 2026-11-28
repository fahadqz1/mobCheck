import type { ConversationKind, Prisma } from '@prisma/client';
import prisma from './prisma';
import type { SessionUser } from './session';
import { listingRef, bookingRef } from './format';

export class ChatError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Resolves the two participants of a new conversation and enforces who may start one.
// The starter is always the customer side; the recipient is the seller or shop owner.
async function resolveConversationTarget(user: SessionUser, kind: ConversationKind, refId: string) {
  if (kind === 'LISTING') {
    const listing = await prisma.phoneListing.findUnique({ where: { id: refId }, select: { id: true, userId: true, status: true } });
    if (!listing || listing.status !== 'ACTIVE') throw new ChatError('This listing is no longer available.', 404);
    if (listing.userId === user.id) throw new ChatError('This is your own listing.');
    return { starterId: user.id, recipientId: listing.userId, contextKey: `LISTING:${listing.id}:${user.id}`, data: { listingId: listing.id } };
  }
  if (kind === 'SHOP') {
    const shop = await prisma.shop.findUnique({ where: { id: refId }, select: { id: true, ownerId: true, status: true } });
    if (!shop || shop.status !== 'VERIFIED') throw new ChatError('This shop is not available.', 404);
    if (shop.ownerId === user.id) throw new ChatError('This is your own shop.');
    return { starterId: user.id, recipientId: shop.ownerId, contextKey: `SHOP:${shop.id}:${user.id}`, data: { shopId: shop.id } };
  }
  const booking = await prisma.inspectionBooking.findUnique({ where: { id: refId }, select: { id: true, customerId: true, shopId: true, status: true, shop: { select: { ownerId: true } } } });
  if (!booking || (user.id !== booking.customerId && user.id !== booking.shop.ownerId)) throw new ChatError('Booking not found.', 404);
  if (booking.status === 'AWAITING_PAYMENT') throw new ChatError('You can message the shop once the booking is paid.');
  // One thread per booking, whichever side opens it first.
  return { starterId: booking.customerId, recipientId: booking.shop.ownerId, contextKey: `BOOKING:${booking.id}`, data: { bookingId: booking.id, shopId: booking.shopId } };
}

export async function startConversation(user: SessionUser, kind: ConversationKind, refId: string) {
  const t = await resolveConversationTarget(user, kind, refId);
  return prisma.conversation.upsert({
    where: { contextKey: t.contextKey },
    update: {},
    create: { kind, contextKey: t.contextKey, starterId: t.starterId, recipientId: t.recipientId, ...t.data },
    select: { id: true },
  });
}

export async function loadParticipantConversation(user: SessionUser, id: string) {
  const c = await prisma.conversation.findUnique({ where: { id } });
  if (!c) return null;
  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'OPS_ADMIN';
  if (c.starterId !== user.id && c.recipientId !== user.id && !isAdmin) return null;
  return { conversation: c, side: c.starterId === user.id ? ('starter' as const) : c.recipientId === user.id ? ('recipient' as const) : ('admin' as const) };
}

export const conversationListInclude = {
  starter: { select: { id: true, firstName: true, lastName: true } },
  recipient: { select: { id: true, firstName: true, lastName: true } },
  listing: { select: { id: true, title: true } },
  shop: { select: { name: true, slug: true } },
  booking: { select: { id: true, brand: { select: { name: true } }, model: { select: { name: true } } } },
  messages: { where: { status: 'DELIVERED' }, orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, imageKey: true, createdAt: true, senderId: true } },
} satisfies Prisma.ConversationInclude;

type ConvRow = Prisma.ConversationGetPayload<{ include: typeof conversationListInclude }>;

export function summarise(c: ConvRow, userId: string) {
  const other = c.starterId === userId ? c.recipient : c.starter;
  const lastRead = c.starterId === userId ? c.starterReadAt : c.recipientReadAt;
  const last = c.messages[0];
  const otherName = c.kind === 'SHOP' && c.starterId === userId && c.shop ? c.shop.name : [other.firstName, other.lastName?.[0] ? `${other.lastName[0]}.` : ''].filter(Boolean).join(' ') || 'MobCheck user';
  const context =
    c.kind === 'LISTING'
      ? c.listing ? `${c.listing.title} · ${listingRef(c.listing.id)}` : 'Listing removed'
      : c.kind === 'BOOKING' && c.booking
        ? `Inspection ${bookingRef(c.booking.id)} · ${c.booking.brand.name} ${c.booking.model.name}`
        : c.shop ? `Shop: ${c.shop.name}` : 'Conversation';
  return {
    id: c.id,
    kind: c.kind,
    otherName,
    context,
    contextHref: c.kind === 'LISTING' && c.listing ? `/listings/${c.listing.id}` : c.kind === 'SHOP' && c.shop ? `/shops/${c.shop.slug}` : null,
    lastMessage: last ? (last.imageKey ? '📷 Photo' : last.body || '') : 'No messages yet',
    lastAt: (last?.createdAt ?? c.lastMessageAt).toISOString(),
    unread: Boolean(last && last.senderId !== userId && (!lastRead || last.createdAt > lastRead)),
  };
}

