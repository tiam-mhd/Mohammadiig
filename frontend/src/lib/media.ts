/**
 * Media URL contract (site + admin):
 * - Persist ONLY relative `/media/...` paths (or external https CDN / data:).
 * - Never persist localhost/prod hosts in DB or form state.
 * - Display via resolveMediaUrl() → same-origin `/media/...`
 *   (Next.js rewrites /media/* and /api/* → Nest). Works on localhost, LAN, mobile.
 */

function collapseSlashes(path: string): string {
  return path.replace(/\/{2,}/g, "/");
}

function normalizeApiBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

function isLoopbackApiBase(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host === "::1"
    );
  } catch {
    return false;
  }
}

/** API/media origin for rare absolute needs (downloads, emails). Prefer relative in UI. */
export function getApiOrigin(): string {
  const configured = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL ?? "");
  if (typeof window !== "undefined") {
    if (!configured || isLoopbackApiBase(configured))
      return window.location.origin;
    return configured.replace(/\/api$/i, "");
  }
  if (configured && !isLoopbackApiBase(configured)) {
    return configured.replace(/\/api$/i, "");
  }
  const internal =
    normalizeApiBase(process.env.API_INTERNAL_URL ?? "") ||
    "http://127.0.0.1:3001/api";
  return internal.replace(/\/api$/i, "");
}

/** Prefer storing `/media/...` so the same DB works across local and production. */
export function toRelativeMediaPath(
  urlOrPath: string | null | undefined,
): string {
  const raw = String(urlOrPath ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:") || raw.startsWith("blob:")) return raw;

  let value = raw.replace(/\\/g, "/");

  try {
    if (/^https?:\/\//i.test(value)) {
      const parsed = new URL(value);
      let pathname = parsed.pathname || "";
      if (pathname.startsWith("/api/media/")) {
        pathname = pathname.slice(4);
      }
      if (pathname.startsWith("/media/")) {
        return collapseSlashes(`${pathname}${parsed.search}`);
      }
      return value;
    }
  } catch {
    /* fall through */
  }

  if (value.startsWith("/api/media/")) {
    value = value.slice(4);
  }
  if (value.startsWith("/media/")) return collapseSlashes(value);
  if (/^media\//i.test(value)) return collapseSlashes(`/${value}`);
  if (/^\d{4}\/\d{2}\//.test(value)) return collapseSlashes(`/media/${value}`);
  return value;
}

/**
 * Resolve a stored media reference for <img>/<video>/href.
 * Library paths stay site-relative so every device hitting the frontend works.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;

  const relative = toRelativeMediaPath(url);
  if (!relative) return "";

  if (/^https?:\/\//i.test(relative)) return relative;
  if (relative.startsWith("/media/")) return relative;
  if (relative.startsWith("/")) return relative;
  return collapseSlashes(`/media/${relative}`);
}

/** Absolute URL — only when a full URL is required. */
export function resolveAbsoluteMediaUrl(
  url: string | null | undefined,
): string {
  const resolved = resolveMediaUrl(url);
  if (!resolved) return "";
  if (/^(https?:|data:|blob:)/i.test(resolved)) return resolved;
  const origin = getApiOrigin();
  return resolved.startsWith("/")
    ? `${origin}${resolved}`
    : `${origin}/media/${resolved}`;
}

export function formatBytes(size: number | null | undefined): string {
  if (!size || size <= 0) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function isVideoMedia(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType && mimeType.toLowerCase().startsWith("video/"));
}
