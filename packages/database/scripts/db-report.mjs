// Read-only: prints row counts for every table in the public schema.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const tables = await prisma.$queryRawUnsafe(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
);
const counts = {};
for (const { tablename } of tables) {
  const [{ n }] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${tablename}"`);
  counts[tablename] = n;
}
console.log(JSON.stringify(counts, null, 2));
await prisma.$disconnect();
