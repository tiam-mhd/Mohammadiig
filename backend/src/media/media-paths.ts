import { existsSync, mkdirSync } from 'node:fs';
import { isAbsolute, join, normalize, resolve, sep } from 'node:path';

function collapseSlashes(path: string): string {
  return path.replace(/\/{2,}/g, '/');
}

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
  return collapseSlashes(`/media/${clean}`);
}

/**
 * Normalize any stored media reference to a relative `/media/...` path when possible.
 * Leaves external absolute URLs (e.g. CDN) and data: URIs unchanged.
 */
export function toRelativeMediaPath(urlOrPath: string | null | undefined): string {
  const raw = String(urlOrPath ?? '').trim();
  if (!raw) return '';
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  let value = raw.replace(/\\/g, '/');

  try {
    if (/^https?:\/\//i.test(value)) {
      const parsed = new URL(value);
      let pathname = parsed.pathname || '';
      if (pathname.startsWith('/api/media/')) {
        pathname = pathname.slice(4);
      }
      if (pathname.startsWith('/media/')) {
        return collapseSlashes(`${pathname}${parsed.search}`);
      }
      // Foreign absolute URL (Unsplash, CDN, …) — keep as-is
      return value;
    }
  } catch {
    /* fall through */
  }

  if (value.startsWith('/api/media/')) {
    value = value.slice(4);
  }
  if (value.startsWith('/media/')) return collapseSlashes(value);
  if (/^media\//i.test(value)) return collapseSlashes(`/${value}`);
  if (/^\d{4}\/\d{2}\//.test(value)) return collapseSlashes(`/media/${value}`);
  return value;
}

/** Normalize a gallery/list of media refs; drops empties and dedupes. */
export function normalizeMediaList(urls: Array<string | null | undefined> | null | undefined): string[] {
  if (!Array.isArray(urls)) return [];
  const next = urls.map((item) => toRelativeMediaPath(item)).filter(Boolean);
  return Array.from(new Set(next));
}

export function dateFolderParts(date = new Date()): { year: string; month: string } {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return { year, month };
}
