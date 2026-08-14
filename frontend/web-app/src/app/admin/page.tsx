import { listUsers, ManagedUser } from '@/app/actions/adminActions';
import { getCurrentUser } from '@/app/actions/authActions';
import { getAllEscrows, getDisputedEscrows } from '@/app/actions/escrowActions';
import { getPendingApplications, getVerifiedUsers, ReviewApplication, VerifiedUser } from '@/app/actions/verificationActions';
import PageHero from '@/app/components/PageHero';
import { Escrow } from '@/types';
import Link from 'next/link';
import AdminAnnounce from './AdminAnnounce';
import AdminDashboard from './AdminDashboard';
import AdminRevokeVerification from './AdminRevokeVerification';
import AdminRoles from './AdminRoles';
import SellerApplications from './SellerApplications';

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

  const [disputed, all, applications, admins, verified] = await Promise.all([
    getDisputedEscrows(),
    getAllEscrows(),
    getPendingApplications(),
    listUsers(''),
    getVerifiedUsers(''),
  ]);
  const apps: ReviewApplication[] = Array.isArray(applications) ? applications : [];
  const adminUsers: ManagedUser[] = Array.isArray(admins) ? admins : [];
  const verifiedUsers: VerifiedUser[] = Array.isArray(verified) ? verified : [];

  return (
    <div className="space-y-12">
      <div>
        <PageHero
          eyebrow="Admin"
          title="Platform administration"
          subtitle="Approve auctioneers and oversee escrow settlements and disputes."
        />
      </div>
      <AdminAnnounce />
      <SellerApplications initial={apps} />
      <AdminRoles initial={adminUsers} />
      <AdminRevokeVerification initial={verifiedUsers} />
      <AdminDashboard initialDisputed={asArray(disputed)} initialAll={asArray(all)} />
    </div>
  );
}
