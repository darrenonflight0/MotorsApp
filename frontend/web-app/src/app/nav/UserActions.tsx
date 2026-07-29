'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { AiFillCar, AiFillTrophy, AiOutlineLogout } from 'react-icons/ai';
import { HiBadgeCheck, HiCog, HiUser } from 'react-icons/hi';
import VerifiedBadge from '@/app/components/VerifiedBadge';

type Props = {
  user: { username?: string | null; name?: string | null; role?: string | string[]; verified?: boolean };
};

export default function UserActions({ user }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const setParams = useParamsStore((state) => state.setParams);

  const isAdmin = Array.isArray(user.role) ? user.role.includes('Admin') : user.role === 'Admin';

  function setWinner() {
    setParams({ winner: user.username ?? undefined, seller: undefined });
    if (window.location.pathname !== '/') router.push('/');
    setOpen(false);
  }

  function setSeller() {
    setParams({ seller: user.username ?? undefined, winner: undefined });
    if (window.location.pathname !== '/') router.push('/');
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-display font-semibold text-fg transition-colors hover:text-redline"
      >
        <HiUser /> {user.name}
        <VerifiedBadge verified={user.verified} size="sm" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-3 w-56 rounded-xl border border-line/80 bg-surface py-1 text-sm shadow-lot-hover"
          >
            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="dropdown-item block font-semibold !text-redline"
                >
                  <HiCog className="mr-2 inline" /> Admin dashboard
                </Link>
                <div className="my-1 border-t border-line/70" />
              </>
            )}
            {user.username && (
              <Link
                href={`/users/${encodeURIComponent(user.username)}`}
                onClick={() => setOpen(false)}
                className="dropdown-item block"
              >
                <HiUser className="mr-2 inline" /> My showroom
              </Link>
            )}
            <button onClick={setSeller} className="dropdown-item">
              <AiFillCar className="mr-2 inline" /> My Auctions
            </button>
            <button onClick={setWinner} className="dropdown-item">
              <AiFillTrophy className="mr-2 inline" /> Auctions won
            </button>
            {user.verified ? (
              <Link href="/auctions/create" onClick={() => setOpen(false)} className="dropdown-item block">
                <AiFillCar className="mr-2 inline" /> List a car
              </Link>
            ) : (
              <Link href="/verify" onClick={() => setOpen(false)} className="dropdown-item block font-semibold text-sky-600">
                <HiBadgeCheck className="mr-2 inline" /> Get verified to sell
              </Link>
            )}
            <Link href="/session" onClick={() => setOpen(false)} className="dropdown-item block">
              <HiUser className="mr-2 inline" /> Session (dev)
            </Link>
            <div className="my-1 border-t border-line/70" />
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="dropdown-item !text-redline"
            >
              <AiOutlineLogout className="mr-2 inline" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
