// Prisma returns Date and Decimal objects, which Next.js page props cannot carry.
export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
