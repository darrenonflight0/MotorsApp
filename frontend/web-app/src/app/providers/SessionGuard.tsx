'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

/**
 * Watches the NextAuth session for a failed token refresh.
 *
 * Access tokens live 15 min and are renewed via one-time-use rotating refresh
 * tokens. If a refresh fails (e.g. the IdentityService restarted and dropped its
 * in-memory grants, or the sliding refresh window lapsed), the session keeps a
 * now-expired access token and NextAuth tags it with `RefreshAccessTokenError`.
 * Left unhandled, every authenticated call 401s and the user only sees a generic
 * "Problem submitting" toast. Here we detect that state once and re-run the
 * OIDC flow — silent if the IdP session is still alive, otherwise a re-login.
 */
export default function SessionGuard() {
  const { data: session } = useSession();
  const recovering = useRef(false);

  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError' && !recovering.current) {
      recovering.current = true;
      toast.error('Your session expired — signing you back in…');
      signIn('id-server');
    }
  }, [session?.error]);

  return null;
}
