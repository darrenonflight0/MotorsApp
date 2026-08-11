import { ImageResponse } from 'next/og';

// Social share preview card (Open Graph / Twitter). Shown when a Yamkela link
// is shared. Applies site-wide.
export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Yamkela Motors — Live Car Auctions';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#0e1116',
          padding: 90,
        }}
      >
        <div style={{ display: 'flex', width: 90, height: 10, background: '#e4002b', borderRadius: 6, marginBottom: 36 }} />
        <div style={{ display: 'flex', fontSize: 88, fontWeight: 900, color: '#ffffff', letterSpacing: -2 }}>
          YAMKELA MOTORS
        </div>
        <div style={{ display: 'flex', fontSize: 40, color: '#d7dae0', marginTop: 24 }}>
          Your Bid. Your Drive. Your Way.
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#989ea7', marginTop: 48 }}>
          Live car auctions · Real-time bidding · Escrow-protected
        </div>
      </div>
    ),
    { ...size }
  );
}
