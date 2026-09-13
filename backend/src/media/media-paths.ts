import { existsSync, mkdirSync } from 'node:fs';
import { isAbsolute, join, normalize, resolve, sep } from 'node:path';

export function resolveMediaRoot(): string {
  const raw = (process.env.MEDIA_ROOT ?? './data/media').trim() || './data/media';
  const absolute = isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
  if (!existsSync(absolute)) {
    mkdirSync(absolute, { recursive: true });
  }
  return absolute;
}

export function ensureDir(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

export function settingsFilePath(mediaRoot: string): string {
  return join(mediaRoot, '.media-settings.json');
}

export function trashDir(mediaRoot: string): string {
  return join(mediaRoot, '.trash');
}

export function backupsDir(mediaRoot: string): string {
  return join(mediaRoot, '.backups');
}

/** Prevent path traversal outside MEDIA_ROOT. */
export function safeJoinMedia(mediaRoot: string, relativePath: string): string {
  const cleaned = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const absolute = resolve(mediaRoot, cleaned);
  const root = resolve(mediaRoot);
  if (absolute !== root && !absolute.startsWith(root + sep) && !absolute.startsWith(root + '/')) {
    throw new Error('Invalid media path');
  }
  return normalize(absolute);
}

export function publicMediaUrl(relativePath: string): string {
  const clean = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const base = (process.env.MEDIA_PUBLIC_BASE_URL ?? '').trim().replace(/\/+$/, '');
  if (base) return `${base}/media/${clean}`;
  return `/media/${clean}`;
}

export function dateFolderParts(date = new Date()): { year: string; month: string } {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return { year, month };
}
