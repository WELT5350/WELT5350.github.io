import { mkdir, readdir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';

const sourceDirectory = join(process.cwd(), 'src', 'assets', 'backgrounds-source');
const outputDirectory = join(process.cwd(), 'src', 'assets', 'backgrounds');
const supportedExtensions = new Set(['.avif', '.jpg', '.jpeg', '.png', '.webp']);
const maximumBytes = 5 * 1024 * 1024;

await mkdir(outputDirectory, { recursive: true });

let entries = [];
try {
  entries = await readdir(sourceDirectory, { withFileTypes: true });
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  console.log('No source backgrounds found. Add images to src/assets/backgrounds-source/.');
  process.exit(0);
}

const sourceFiles = entries
  .filter((entry) => entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase()))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

if (sourceFiles.length === 0) {
  console.log('No supported source backgrounds found.');
  process.exit(0);
}

let failed = false;
for (const filename of sourceFiles) {
  const input = join(sourceDirectory, filename);
  const output = join(outputDirectory, `${basename(filename, extname(filename))}.webp`);

  await sharp(input)
    .rotate()
    .resize({ width: 3840, height: 3840, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(output);

  const { size } = await stat(output);
  const sizeMiB = (size / 1024 / 1024).toFixed(2);
  console.log(`${filename} -> ${basename(output)} (${sizeMiB} MiB)`);
  if (size > maximumBytes) {
    failed = true;
    console.error(`Generated file exceeds the 5 MiB budget: ${basename(output)}`);
  }
}

if (failed) process.exitCode = 1;
