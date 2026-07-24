import { AuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import DuendeIDS6Provider from 'next-auth/providers/duende-identity-server6';

// Client secret for the `nextApp` OIDC client. Sourced from the environment so
// no real secret lives in source; the literal is a development-only fallback and
// must match IdentityServer__Clients__nextApp__Secret on the IdentityService.
const CLIENT_SECRET = process.env.NEXTAUTH_CLIENT_SECRET ?? 'secret';

// Access tokens are short-lived (15 min); sessions continue via one-time-use
// rotating refresh tokens issued by the IdentityService.
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${process.env.ID_URL}/connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: 'nextApp',
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
    };
  } catch (error) {
    console.error('Failed to refresh access token', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const authOptions: AuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    DuendeIDS6Provider({
      id: 'id-server',
      clientId: 'nextApp',
      clientSecret: CLIENT_SECRET,
      issuer: process.env.ID_URL,
      authorization: { params: { scope: 'openid profile roles auctionApp offline_access' } },
      idToken: true,
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 15 * 60 * 1000;
      }
      if (profile) {
        // `username` and `role` are emitted by the CustomProfileService.
        token.username = (profile as { username?: string }).username;
        token.role = (profile as { role?: string | string[] }).role;
      }

      // Refresh ~60s before expiry.
      if (token.expiresAt && Date.now() > (token.expiresAt as number) - 60_000 && token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.username = token.username;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },
};
