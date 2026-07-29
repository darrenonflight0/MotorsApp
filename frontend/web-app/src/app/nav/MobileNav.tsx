'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HiMenu, HiX } from 'react-icons/hi';

const links = [
  { href: '/', label: 'Auctions' },
  { href: '/countries', label: 'Shop by country' },
  { href: '/how-to-buy', label: 'How to buy' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/about', label: 'About' },
  { href: '/help', label: 'Help' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change and lock body scroll while open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="rounded-lg p-2 text-fg transition-colors hover:text-redline"
      >
        <HiMenu className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 right-0 z-[81] flex w-72 max-w-[85vw] flex-col bg-surface shadow-lot-hover"
            >
              <div className="flex items-center justify-between border-b border-line/70 px-5 py-4">
                <span className="font-display text-sm font-extrabold uppercase tracking-[0.06em] text-fg">
                  Yamkela<span className="ml-1 font-semibold text-muted">Motors</span>
                </span>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1 text-fg hover:text-redline">
                  <HiX className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {links.map((l, i) => {
                  const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
                  return (
                    <motion.div
                      key={l.href}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                    >
                      <Link
                        href={l.href}
                        className={`block rounded-lg px-4 py-3 font-display text-base font-semibold transition-colors ${
                          active ? 'bg-redline/10 text-redline' : 'text-fg hover:bg-canvas'
                        }`}
                      >
                        {l.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="border-t border-line/70 p-3">
                <Link href="/verify" className="btn-primary block w-full text-center">
                  Sell your car
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
