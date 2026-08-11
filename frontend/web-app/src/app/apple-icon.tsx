import { ImageResponse } from 'next/og';

// iOS "Add to Home Screen" icon. Generated from the brand mark.
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0e1116',
        }}
      >
        <div style={{ display: 'flex', fontSize: 110, fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>Y</div>
        <div style={{ display: 'flex', width: 70, height: 8, background: '#e4002b', borderRadius: 4, marginTop: 8 }} />
      </div>
    ),
    { ...size }
  );
}
