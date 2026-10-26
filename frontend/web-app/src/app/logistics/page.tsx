import { getCurrentUser } from '@/app/actions/authActions';
import { getLogisticsJobs } from '@/app/actions/escrowActions';
import PageHero from '@/app/components/PageHero';
import Link from 'next/link';
import LogisticsJobs from './LogisticsJobs';

export const metadata = {
  title: 'Logistics · Yamkela Motors',
};

function hasAccess(role?: string | string[]) {
  const roles = Array.isArray(role) ? role : role ? [role] : [];
  return roles.includes('Logistics') || roles.includes('Admin');
}

export default async function LogisticsPage() {
  const user = await getCurrentUser();

  if (!user || !hasAccess(user.role)) {
    return (
      <div>
        <PageHero
          eyebrow="Logistics"
          title={user ? 'Not authorised' : 'Sign in required'}
          subtitle="This area is for our logistics partner. Ask an admin to grant you access."
        />
        <Link href="/" className="btn-primary">Back to auctions</Link>
      </div>
    );
  }

  const res = await getLogisticsJobs();
  const jobs = Array.isArray(res) ? res : [];

  return (
    <div>
      <PageHero
        eyebrow="Logistics"
        title="Collections and shipments"
        subtitle="Paid sales waiting on collection or in transit. Post an update at each step; the buyer and seller are notified."
      />
      <LogisticsJobs initial={jobs} />
    </div>
  );
}
