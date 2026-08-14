import { getCurrentUser, getSession } from '@/app/actions/authActions';
import Heading from '@/app/components/Heading';
import PageHero from '@/app/components/PageHero';
import Link from 'next/link';

function isAdmin(role?: string | string[]) {
  return Array.isArray(role) ? role.includes('Admin') : role === 'Admin';
}

export default async function SessionPage() {
  const user = await getCurrentUser();

  // Developer-only view: it exposes the raw session (including the access token),
  // so it's restricted to admins. Everyone else is turned away.
  if (!user || !isAdmin(user.role)) {
    return (
      <div>
        <PageHero
          eyebrow="Restricted"
          title="Not available"
          subtitle="This developer view is limited to platform administrators."
        />
        <Link href="/" className="btn-primary">Back to auctions</Link>
      </div>
    );
  }

  const session = await getSession();

  return (
    <div className="flex flex-col gap-4">
      <Heading title="Session dashboard" subtitle="Development view of the current NextAuth session" />
      <pre className="readout overflow-auto rounded-xl border border-line/60 bg-ink p-4 text-xs text-racing">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}
