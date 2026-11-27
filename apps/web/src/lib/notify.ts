import prisma from './prisma';

export async function notify(userId: string, title: string, body?: string, link?: string) {
  try {
    await prisma.notification.create({ data: { userId, title, body, link } });
  } catch (error) {
    // A failed notification must never fail the action that triggered it.
    console.error('notify failed', error);
  }
}

export async function notifyMany(userIds: string[], title: string, body?: string, link?: string) {
  await Promise.all(userIds.map((id) => notify(id, title, body, link)));
}
