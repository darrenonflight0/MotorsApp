'use client';

import { signIn } from 'next-auth/react';

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn('id-server', { callbackUrl: '/' }, { prompt: 'login' })}
      className="rounded-lg bg-redline px-4 py-2 font-display text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:bg-redline-deep active:translate-y-px"
    >
      Login
    </button>
  );
}
