'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { AiFillCar, AiFillTrophy, AiOutlineLogout } from 'react-icons/ai';
import { HiCog, HiUser } from 'react-icons/hi';

type Props = {
  user: { username?: string | null; name?: string | null };
};

export default function UserActions({ user }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const setParams = useParamsStore((state) => state.setParams);

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
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-display font-semibold text-ink transition-colors hover:text-redline"
      >
        <HiUser /> {user.name}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-3 w-56 rounded-xl border border-chrome/80 bg-paper-raised py-1 text-sm shadow-lot-hover"
          >
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
            <Link href="/auctions/create" onClick={() => setOpen(false)} className="dropdown-item block">
              <HiCog className="mr-2 inline" /> Create auction
            </Link>
            <Link href="/session" onClick={() => setOpen(false)} className="dropdown-item block">
              <HiUser className="mr-2 inline" /> Session (dev)
            </Link>
            <div className="my-1 border-t border-chrome/70" />
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
