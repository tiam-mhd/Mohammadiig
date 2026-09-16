import type { NextConfig } from "next";
import path from "node:path";

/** Nest origin that serves /api and /media (server-side proxy target only). */
function resolveBackendOrigin(): string {
  const raw = (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://127.0.0.1:3001/api"
  )
    .trim()
    .replace(/\/+$/, "");
  const origin = raw.replace(/\/api$/i, "") || "http://127.0.0.1:3001";
  // Prefer IPv4 loopback — on Windows, "localhost" can resolve to ::1 and miss Nest.
  return origin.replace(/^(https?:\/\/)localhost(?=[:/]|$)/i, "$1127.0.0.1");
}

const backendOrigin = resolveBackendOrigin();

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    // Same-origin proxy so phone/LAN never talk to their own localhost.
    // Browser hits http://<pc-ip>:3000/api|media → Next forwards to Nest on this machine.
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: "/media/:path*",
        destination: `${backendOrigin}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
