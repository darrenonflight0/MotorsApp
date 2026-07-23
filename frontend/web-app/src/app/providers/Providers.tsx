'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import SignalRProvider from './SignalRProvider';
import SessionGuard from './SessionGuard';

type Props = {
  children: ReactNode;
};

export default function Providers({ children }: Props) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <SessionGuard />
      <SignalRProvider>
        <Toaster position="bottom-right" />
        {children}
      </SignalRProvider>
    </SessionProvider>
  );
}
