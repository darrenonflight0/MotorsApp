'use client';

import { getVerifiedUsers, revokeVerification, VerifiedUser } from '@/app/actions/verificationActions';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiBadgeCheck, HiSearch, HiXCircle } from 'react-icons/hi';

// Admin control to revoke a verified user's seller authorisation. Search by
// username (empty = all verified users), then un-authorise with one click.
export default function AdminRevokeVerification({ initial }: { initial: VerifiedUser[] }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<VerifiedUser[]>(initial);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await getVerifiedUsers(query.trim());
      if (cancelled) return;
      setUsers(res);
      setLoading(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  async function revoke(u: VerifiedUser) {
    if (!confirm(`Revoke ${u.username}'s seller authorisation? They'll need to re-apply to sell.`)) return;
    setBusy(u.username);
    try {
      const res = await revokeVerification(u.username);
      if ('error' in res) throw new Error(res.error.message);
      setUsers((list) => list.filter((x) => x.username !== u.username));
      toast.success(`${u.username} is no longer authorised to sell`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not revoke authorisation');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <span className="eyebrow">Access control</span>
      <h2 className="mb-1 mt-1 flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-fg">
        <HiBadgeCheck className="h-6 w-6 text-redline" />
        Authorised sellers
      </h2>
      <p className="mb-4 text-sm text-muted">
        Verified users allowed to list cars. Revoke to remove their authorisation — they can re-apply.
      </p>

      <div className="rounded-xl border border-line/70 bg-surface p-4 shadow-lot">
        <div className="flex items-center gap-2 rounded-lg border border-line/70 bg-canvas px-3">
          <HiSearch className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search verified users by username…"
            className="w-full bg-transparent py-2 text-fg outline-none"
          />
        </div>

        <div className="mt-3 divide-y divide-line/60">
          {loading && users.length === 0 ? (
            <p className="py-4 text-sm text-muted">Loading…</p>
          ) : users.length === 0 ? (
            <p className="py-4 text-sm text-muted">No verified users found.</p>
          ) : (
            users.map((u) => (
              <div key={u.username} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-canvas">
                    {u.profilePicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.profilePicture} alt={u.username} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-sm font-bold text-muted">
                        {u.username.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="flex items-center gap-1 font-display font-semibold text-fg">
                    {u.username}
                    <HiBadgeCheck className="h-4 w-4 text-sky-500" />
                  </span>
                </div>
                <button
                  disabled={busy === u.username}
                  onClick={() => revoke(u)}
                  className="flex items-center gap-1.5 rounded-lg border border-redline/40 px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide text-redline transition-colors hover:bg-redline hover:text-paper disabled:opacity-50"
                >
                  <HiXCircle className="h-4 w-4" /> {busy === u.username ? 'Revoking…' : 'Revoke'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
