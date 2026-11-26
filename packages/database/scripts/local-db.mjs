import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.pgdata');

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'password',
  port: 5432,
  persistent: true,
});

if (!existsSync(dataDir)) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase('mobcheck_dev');
} catch {
  // already exists
}

console.log('PostgreSQL running on localhost:5432 (db: mobcheck_dev). Press Ctrl+C to stop.');

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
