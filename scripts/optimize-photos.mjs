/**
 * Photo optimization pass.  node scripts/optimize-photos.mjs
 *
 * Takes the camera-resolution originals dropped into public/, writes web-ready
 * derivatives as AVIF with a WebP fallback into the right folder under
 * public/, and moves the original out to assets/originals/ so it is archived
 * but never deployed.
 *
 * public/ is organized by what a file IS, not where it is used:
 *   logos/        brand marks, ours and other people's
 *   imagery/      general club photography
 *   events/       photography tied to a named event or partner
 *   screenshots/  README captures, not used by the site
 *
 * 1600px is the cap. The widest slot any of these fills is roughly 900 CSS px,
 * so 1600 still covers a 2x display without shipping a 2048px master.
 * next/image resizes per breakpoint below that; this only controls what it
 * starts from.
 *
 * Idempotent: a photo whose original is already archived is skipped, so it is
 * safe to re-run after adding a few more.
 */
import sharp from 'sharp';
import { mkdir, copyFile, rm, stat, readdir } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC = 'public';
const ARCHIVE = path.join('assets', 'originals');
const MAX_WIDTH = 1600;

/** source basename in public/ -> [destination folder, output slug] */
const PHOTOS = {
  'Sales-Comp.jpeg': ['imagery', 'sales-comp-1'],
  'Sales-Comp-2.jpeg': ['imagery', 'sales-comp-2'],
  'Sales-Comp-3.jpeg': ['imagery', 'sales-comp-3'],
  'Sales-Comp-4.jpeg': ['imagery', 'sales-comp-4'],
  'Sales-Comp-5.jpeg': ['imagery', 'sales-comp-5'],
  'Vantage-1.jpeg': ['events', 'vantage-1'],
  'Vantage-2.jpeg': ['events', 'vantage-2'],
  'Vantage-3.jpeg': ['events', 'vantage-3'],
  'College-Pro.jpeg': ['events', 'college-pro'],
  'tethos-logo.jpeg': ['logos', 'tethos'],
};

/*
  Unreferenced leftovers from the pre-Floor design. Archived rather than
  optimized: nothing points at them, so re-encoding would be busywork. They
  were also 7.5MB of the deployed bundle for no reason.
*/
const DEAD = [
  'abt1.avif',
  'abt2.avif',
  'MIDDLESEX.avif',
  'NEWYORK.avif',
  'TORONTO.avif',
  'UC-HILL.avif',
  'shark.avif',
  'TSI.avif',
];

const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

const kb = (n) => `${Math.round(n / 1024)}KB`;

await mkdir(ARCHIVE, { recursive: true });

let before = 0;
let after = 0;
let done = 0;

for (const [file, [dir, slug]] of Object.entries(PHOTOS)) {
  const src = path.join(PUBLIC, file);
  if (!(await exists(src))) continue;

  const dest = path.join(PUBLIC, dir);
  await mkdir(dest, { recursive: true });

  const { width, height } = await sharp(src).metadata();
  const { size: originalSize } = await stat(src);
  const resize = width > MAX_WIDTH ? { width: MAX_WIDTH } : null;
  const from = () => (resize ? sharp(src).resize(resize) : sharp(src));

  const avif = await from()
    .avif({ quality: 58, effort: 6 })
    .toFile(path.join(dest, `${slug}.avif`));
  const webp = await from()
    .webp({ quality: 80 })
    .toFile(path.join(dest, `${slug}.webp`));

  await copyFile(src, path.join(ARCHIVE, file));
  await rm(src);

  before += originalSize;
  after += avif.size;
  done += 1;

  console.log(
    `${(dir + '/' + slug).padEnd(24)} ${width}x${height} -> ${avif.width}x${avif.height}   ` +
      `src ${kb(originalSize).padStart(7)}   avif ${kb(avif.size).padStart(7)}   webp ${kb(webp.size).padStart(7)}`
  );
}

for (const file of DEAD) {
  const src = path.join(PUBLIC, file);
  if (!(await exists(src))) continue;
  const { size } = await stat(src);
  await copyFile(src, path.join(ARCHIVE, file));
  await rm(src);
  before += size;
  console.log(`${file.padEnd(15)} archived, unreferenced   src ${kb(size).padStart(7)}`);
}

console.log(
  done || before
    ? `\n${done} image(s) optimized. public/ shed ${kb(before)} and carries ${kb(after)} of AVIF.`
    : '\nNothing to do: every original is already archived.'
);
console.log(`archive now holds ${(await readdir(ARCHIVE)).length} files.`);
