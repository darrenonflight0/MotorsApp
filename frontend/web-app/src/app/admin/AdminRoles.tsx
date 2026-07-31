'use client';

import { grantAdmin, listUsers, ManagedUser, revokeAdmin } from '@/app/actions/adminActions';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiBadgeCheck, HiOutlineShieldCheck, HiSearch } from 'react-icons/hi';

export default function AdminRoles({ initial }: { initial: ManagedUser[] }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ManagedUser[]>(initial);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Debounced search. Empty query falls back to the current-admins list.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await listUsers(query.trim());
      if (cancelled) return;
      setUsers(res);
      setLoading(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  async function toggle(u: ManagedUser) {
    setBusy(u.username);
    try {
      const res = u.isAdmin ? await revokeAdmin(u.username) : await grantAdmin(u.username);
      if ('error' in res) throw new Error(res.error.message);
      setUsers((list) => list.map((x) => (x.username === u.username ? { ...x, isAdmin: res.isAdmin } : x)));
      toast.success(res.isAdmin ? `${u.username} is now an admin` : `Removed admin from ${u.username}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update admin access');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <span className="eyebrow">Access control</span>
      <h2 className="mb-1 mt-1 flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-fg">
        <HiOutlineShieldCheck className="h-6 w-6 text-redline" />
        Admin access
      </h2>
      <p className="mb-4 text-sm text-muted">
        Search a registered user to grant admin, or remove access below. Changes take effect the next
        time that person signs in.
      </p>

      <div className="mb-4 flex h-11 max-w-md items-center rounded-full border border-line/40 bg-surface px-4 focus-within:border-redline">
        <HiSearch className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by username to promote…"
          className="ml-2 w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted/60"
        />
      </div>

      <div className="rounded-xl border border-line/80 bg-surface shadow-lot">
        {loading && users.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted">Loading…</div>
        ) : users.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted">
            {query.trim() ? `No users found for “${query.trim()}”.` : 'No admins yet.'}
          </div>
        ) : (
          <ul className="divide-y divide-line/60">
            <AnimatePresence initial={false}>
              {users.map((u) => (
                <motion.li
                  key={u.username}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-ink font-display text-sm font-bold text-paper">
                    {u.profilePicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.profilePicture} alt="" className="h-full w-full object-cover" />
                    ) : (
                      u.username.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-display text-sm font-bold text-fg">
                      @{u.username}
                      {u.verified && <HiBadgeCheck className="h-4 w-4 shrink-0 text-sky-500" aria-label="Verified" />}
                      {u.isAdmin && (
                        <span className="rounded-full bg-redline/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-redline">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted">{u.name}</div>
                  </div>
                  <button
                    disabled={busy === u.username}
                    onClick={() => toggle(u)}
                    className={`shrink-0 rounded-lg px-3 py-2 font-display text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 ${
                      u.isAdmin
                        ? 'border border-redline/40 text-redline hover:bg-redline hover:text-paper'
                        : 'bg-redline text-paper hover:bg-redline-deep'
                    }`}
                  >
                    {busy === u.username ? '…' : u.isAdmin ? 'Remove' : 'Make admin'}
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
}
