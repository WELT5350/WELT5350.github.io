import { resolve } from 'node:path';
import sharp from 'sharp';

export type BackgroundTone = 'balanced' | 'bright' | 'dark' | 'dramatic';

const toneCache = new Map<string, Promise<BackgroundTone>>();

function classifyBackground(luminance: number, variation: number): BackgroundTone {
  if (variation >= 72) return 'dramatic';
  if (luminance >= 175) return 'bright';
  if (luminance <= 95) return 'dark';
  return 'balanced';
}

export function getBackgroundTone(sourcePath: string): Promise<BackgroundTone> {
  const cachedTone = toneCache.get(sourcePath);
  if (cachedTone) return cachedTone;

  const tone = sharp(resolve(process.cwd(), `.${sourcePath}`))
    .stats()
    .then(({ channels }) => {
      const [red, green, blue] = channels;
      const luminance = 0.2126 * red.mean + 0.7152 * green.mean + 0.0722 * blue.mean;
      const variation = 0.2126 * red.stdev + 0.7152 * green.stdev + 0.0722 * blue.stdev;
      return classifyBackground(luminance, variation);
    });

  toneCache.set(sourcePath, tone);
  return tone;
}
