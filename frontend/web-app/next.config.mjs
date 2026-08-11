/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Sellers paste listing image URLs from arbitrary hosts, so next/image must
    // accept any https source rather than a fixed allow-list (an unlisted host
    // otherwise throws and crashes the auction detail page). FallbackImage still
    // handles per-image load failures at runtime.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    // Car listings carry several uploaded photos (compressed data URIs) through
    // server actions; raise the default 1 MB body limit to accommodate them.
    serverActions: { bodySizeLimit: '8mb' },
  },
  async headers() {
    // Security headers. Anti-clickjacking (frame-ancestors/X-Frame-Options),
    // MIME-sniffing, referrer and transport hardening. `camera=(self)` keeps the
    // seller-verification capture working. Deliberately no restrictive script-src
    // CSP here — it would break Next's inline runtime and the Paystack widget.
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default nextConfig;
