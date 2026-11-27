import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

// Local-disk driver. Swap for S3/R2 in production by keeping the same three functions.
const ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const SIGNATURES: { mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/webp', ext: 'webp', test: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
];

export class UploadError extends Error {}

// Trust the file's bytes, not the client-supplied MIME type.
export async function readImage(file: File | null) {
  if (!file || typeof file === 'string') throw new UploadError('No image was attached.');
  if (file.size === 0) throw new UploadError('The image is empty.');
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError('Images must be 8 MB or smaller.');
  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = SIGNATURES.find((s) => s.test(buffer));
  if (!kind) throw new UploadError('Only JPEG, PNG or WebP images are allowed.');
  return { buffer, mime: kind.mime, ext: kind.ext, size: buffer.length };
}

export async function saveFile(prefix: string, buffer: Buffer, ext: string) {
  const key = `${prefix}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
  const full = resolveKey(key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer);
  return key;
}

export async function readFile(key: string) {
  return fs.readFile(resolveKey(key));
}

export async function deleteFile(key: string) {
  await fs.rm(resolveKey(key), { force: true });
}

function resolveKey(key: string) {
  if (!/^[a-z0-9-]+(\/[a-zA-Z0-9_-]+)*\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(key)) throw new UploadError('Invalid file key');
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new UploadError('Invalid file key');
  return full;
}
