import type { MetadataRoute } from 'next';

// Web app manifest — makes the site installable ("Add to Home Screen") and
// gives browsers the brand icon + colours. Applies across every page.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Yamkela Motors — Live Car Auctions',
    short_name: 'Yamkela',
    description: 'Your Bid. Your Drive. Your Way.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0e1116',
    theme_color: '#0e1116',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
