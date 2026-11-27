// Creates <target> as an exact copy of <source> (PostgreSQL TEMPLATE). Never modifies <source>.
// Usage: node scripts/clone-db.mjs mobcheck_dev mobcheck_staging
import { PrismaClient } from '@prisma/client';

const [source, target] = process.argv.slice(2);
if (!/^[a-z0-9_]+$/.test(source || '') || !/^[a-z0-9_]+$/.test(target || '') || source === target) {
  console.error('Usage: node scripts/clone-db.mjs <source> <target>');
  process.exit(1);
}
const adminUrl = process.env.DATABASE_URL.replace(/\/[^/?]+(\?|$)/, '/postgres$1');
const prisma = new PrismaClient({ datasources: { db: { url: adminUrl } } });
const exists = await prisma.$queryRawUnsafe(`SELECT 1 FROM pg_database WHERE datname = '${target}'`);
if (exists.length) {
  console.error(`Database ${target} already exists; refusing to overwrite it.`);
  process.exit(1);
}
await prisma.$executeRawUnsafe(`CREATE DATABASE "${target}" TEMPLATE "${source}"`);
console.log(`Created ${target} from ${source}`);
await prisma.$disconnect();
