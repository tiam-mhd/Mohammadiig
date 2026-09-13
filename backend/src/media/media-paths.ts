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
  // Always persist a site-relative path. Absolute hosts (localhost/prod) break when
  // the same DB is used across environments or opened on mobile.
  return `/media/${clean}`;
}

/**
 * Normalize any stored media reference to a relative `/media/...` path when possible.
 * Leaves external absolute URLs (e.g. CDN) unchanged.
 */
export function toRelativeMediaPath(urlOrPath: string | null | undefined): string {
  const raw = String(urlOrPath ?? '').trim();
  if (!raw) return '';
  if (raw.startsWith('/media/')) return raw.replace(/\/{2,}/g, '/');
  if (raw.startsWith('data:')) return raw;

  try {
    if (/^https?:\/\//i.test(raw)) {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith('/media/')) {
        return `${parsed.pathname}${parsed.search}`;
      }
      // Foreign absolute URL (Unsplash, CDN, …) — keep as-is
      return raw;
    }
  } catch {
    /* fall through */
  }

  if (/^\d{4}\/\d{2}\//.test(raw)) return `/media/${raw}`;
  return raw;
}

export function dateFolderParts(date = new Date()): { year: string; month: string } {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return { year, month };
}
