// Runs a SQL file in one transaction against DATABASE_URL. Refuses to run against mobcheck_dev.
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const file = process.argv[2];
const url = process.env.DATABASE_URL || '';
if (!file) {
  console.error('Usage: node scripts/run-sql.mjs <file.sql>');
  process.exit(1);
}
if (/\/mobcheck_dev(\?|$)/.test(url) && process.env.ALLOW_DEV_DB !== 'yes') {
  console.error('Refusing to run against mobcheck_dev without ALLOW_DEV_DB=yes.');
  process.exit(1);
}
const statements = readFileSync(file, 'utf8')
  .split('\n')
  .filter((l) => !l.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);
const prisma = new PrismaClient();
await prisma.$transaction(statements.map((s) => prisma.$executeRawUnsafe(s)));
console.log(`Executed ${statements.length} statements from ${file}`);
await prisma.$disconnect();
