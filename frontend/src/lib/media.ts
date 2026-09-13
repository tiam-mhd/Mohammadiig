/** Resolve media library / relative image URLs against the API origin. */
export function getApiOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').trim().replace(/\/+$/, '');
  return raw.replace(/\/api$/i, '') || 'http://localhost:3001';
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  const origin = getApiOrigin();
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/media/${url}`;
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
