import sharp from 'sharp';

const MAX_EDGE = 1600;

const esc = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

function overlay(width: number, height: number, label: string) {
  const short = Math.min(width, height);
  const badgeH = Math.max(28, Math.round(short * 0.065));
  const font = Math.round(badgeH * 0.5);
  const badgeW = Math.round(font * 0.62 * label.length + badgeH * 1.4);
  const pad = Math.round(badgeH * 0.45);
  const x = width - badgeW - pad;
  const y = height - badgeH - pad;
  const diag = Math.round(short * 0.11);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <g transform="translate(${width / 2} ${height / 2}) rotate(-24)" opacity="0.13">
    <text text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${diag}" fill="#ffffff" stroke="#0b1220" stroke-width="${Math.max(1, Math.round(diag / 28))}">MobCheck</text>
  </g>
  <g opacity="0.92">
    <rect x="${x}" y="${y}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" fill="#0b1220"/>
    <circle cx="${x + badgeH / 2}" cy="${y + badgeH / 2}" r="${badgeH * 0.3}" fill="#d4f064"/>
    <path d="M${x + badgeH * 0.36} ${y + badgeH * 0.5} l${badgeH * 0.1} ${badgeH * 0.1} l${badgeH * 0.18} -${badgeH * 0.2}" fill="none" stroke="#0b1220" stroke-width="${Math.max(2, badgeH * 0.07)}" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="${x + badgeH * 0.95}" y="${y + badgeH / 2}" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${font}" fill="#ffffff">${esc(label)}</text>
  </g>
</svg>`);
}

// Normalises orientation, caps size, strips EXIF/GPS metadata and stamps the MobCheck mark.
export async function watermarkPhoto(input: Buffer, label = 'MobCheck') {
  const base = sharp(input, { failOn: 'error' }).rotate().resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true });
  const { data, info } = await base.toBuffer({ resolveWithObject: true });
  const out = await sharp(data)
    .composite([{ input: overlay(info.width, info.height, label), top: 0, left: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  return { buffer: out, mime: 'image/jpeg', ext: 'jpg', size: out.length };
}
