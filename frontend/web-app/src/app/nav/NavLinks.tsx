'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Auctions' },
  { href: '/countries', label: 'Shop by country' },
  { href: '/how-to-buy', label: 'How to buy' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/about', label: 'About' },
  { href: '/help', label: 'Help' },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {links.map((l) => {
        const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`group relative rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? 'text-redline' : 'text-ink hover:text-redline'
            }`}
          >
            {l.label}
            {/* shared-layout underline that slides to the active link */}
            {active && (
              <motion.span
                layoutId="nav-underline"
                className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-redline"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            {!active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-redline/40 transition-transform duration-300 group-hover:scale-x-100" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
