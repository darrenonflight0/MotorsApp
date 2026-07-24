import { getCurrentUser } from '@/app/actions/authActions';
import { getAllEscrows, getDisputedEscrows } from '@/app/actions/escrowActions';
import PageHero from '@/app/components/PageHero';
import { Escrow } from '@/types';
import Link from 'next/link';
import AdminDashboard from './AdminDashboard';

export const metadata = {
  title: 'Admin · Yamkela Motors',
};

function isAdmin(role?: string | string[]) {
  return Array.isArray(role) ? role.includes('Admin') : role === 'Admin';
}

function asArray(res: Escrow[] | { error: unknown }): Escrow[] {
  return Array.isArray(res) ? res : [];
}

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div>
        <PageHero eyebrow="Admin" title="Sign in required" subtitle="You need to sign in to view this page." />
        <Link href="/" className="btn-primary">Back to auctions</Link>
      </div>
    );
  }

  if (!isAdmin(user.role)) {
    return (
      <div>
        <PageHero
          eyebrow="Admin"
          title="Not authorised"
          subtitle="This area is restricted to platform administrators."
        />
        <Link href="/" className="btn-primary">Back to auctions</Link>
      </div>
    );
  }

  const [disputed, all] = await Promise.all([getDisputedEscrows(), getAllEscrows()]);

  return (
    <div>
      <PageHero
        eyebrow="Admin"
        title="Platform administration"
        subtitle="Oversee escrow settlements and resolve disputes between buyers and sellers."
      />
      <AdminDashboard initialDisputed={asArray(disputed)} initialAll={asArray(all)} />
    </div>
  );
}
