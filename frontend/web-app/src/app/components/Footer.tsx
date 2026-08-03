import Link from 'next/link';

const groups = [
  {
    heading: 'Buy',
    links: [
      { href: '/', label: 'Live auctions' },
      { href: '/countries', label: 'Shop by country' },
      { href: '/watchlist', label: 'Your watchlist' },
      { href: '/how-to-buy', label: 'How to buy' },
    ],
  },
  {
    heading: 'Logistics',
    links: [
      { href: '/shipping', label: 'Shipping' },
      { href: '/shipping', label: 'Freight calculator' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/help', label: 'Help centre' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/cookies', label: 'Cookie Policy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line/70 bg-ink text-paper">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <div>
          <span className="font-display text-lg font-extrabold uppercase tracking-[0.06em]">
            Yamkela<span className="ml-1.5 font-semibold text-chrome">Motors</span>
          </span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-chrome">
            Live car auctions and vehicle export, protected by signed bidding and escrow payments.
          </p>
        </div>
        {groups.map((g) => (
          <div key={g.heading}>
            <div className="eyebrow !text-chrome">{g.heading}</div>
            <ul className="mt-3 space-y-2">
              {g.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-chrome transition-colors hover:text-paper">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line/60">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-5 py-5 text-xs text-chrome sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} Yamkela Motors. Your Bid. Your Drive. Your Way.</span>
          <span className="flex items-center gap-4">
            <Link href="/terms" className="transition-colors hover:text-paper">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-paper">
              Privacy
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-paper">
              Cookies
            </Link>
            <span className="hidden sm:inline">
              We never ask for your password or card details by email or phone.
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
