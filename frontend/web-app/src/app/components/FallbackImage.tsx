'use client';

import { useState } from 'react';

type Props = {
  src: string;
  alt: string;
  className?: string;
};

// Plain <img> with graceful degradation: if the remote image fails, we hide it
// so the tinted parent panel (and any overlay label/caption) shows instead of a
// broken-image icon. Used for external photography (flags, body styles, freight).
export default function FallbackImage({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-ink-soft to-ink ${className ?? ''}`}
        aria-label={alt}
        role="img"
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="opacity-40" aria-hidden="true">
          <path
            d="M3 13l2-5a2 2 0 011.9-1.3h10.2A2 2 0 0119 8l2 5m-18 0v4a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-4m-18 0h18M6.5 16.5h.01M17.5 16.5h.01"
            stroke="var(--chrome)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />
  );
}
