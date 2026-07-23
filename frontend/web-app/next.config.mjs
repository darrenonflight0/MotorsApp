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
};

export default nextConfig;
