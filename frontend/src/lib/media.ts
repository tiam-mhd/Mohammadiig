/** Resolve media library / relative image URLs against the API origin. */
export function getApiOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').trim().replace(/\/+$/, '');
  return raw.replace(/\/api$/i, '') || 'http://localhost:3001';
}

/** Prefer storing `/media/...` so the same DB works across local and production. */
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
      return raw;
    }
  } catch {
    /* ignore */
  }

  if (/^\d{4}\/\d{2}\//.test(raw)) return `/media/${raw}`;
  return raw;
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  const relative = toRelativeMediaPath(url);
  // External CDN / Unsplash absolute URLs stay absolute.
  if (/^https?:\/\//i.test(relative)) return relative;

  const origin = getApiOrigin();
  if (relative.startsWith('/')) return `${origin}${relative}`;
  return `${origin}/media/${relative}`;
}

export function formatBytes(size: number | null | undefined): string {
  if (!size || size <= 0) return '—';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function isVideoMedia(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType && mimeType.toLowerCase().startsWith('video/'));
}
