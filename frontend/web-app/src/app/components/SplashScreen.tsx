'use client';

import { useEffect, useState } from 'react';
import Loader from './Loader';

// First-visit splash: a branded loading moment on initial app load, then fades.
// Shown once per browser session so returning navigation feels instant.
export default function SplashScreen() {
  const [phase, setPhase] = useState<'show' | 'fading' | 'gone'>('gone');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = sessionStorage.getItem('ym-splash');
    if (seen) return;

    setPhase('show');
    sessionStorage.setItem('ym-splash', '1');
    const fade = setTimeout(() => setPhase('fading'), 1100);
    const done = setTimeout(() => setPhase('gone'), 1550);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      className={`fixed inset-0 z-[80] transition-opacity duration-500 ${
        phase === 'fading' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <Loader fullscreen label="Starting your engines" />
    </div>
  );
}
