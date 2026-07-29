import Link from 'next/link';
import PageHero from '../components/PageHero';
import FallbackImage from '../components/FallbackImage';

export const metadata = {
  title: 'How to buy · Yamkela Motors',
  description: 'Step-by-step: register, deposit, bid, pay, and ship your vehicle with Yamkela Motors.',
};

// Each step carries a topical photo (LoremFlickr, locked seed) and a short
// picture description so buyers can see, not just read, what happens.
const steps = [
  {
    title: 'Registration',
    body: 'Create a free account with a verified email. Add your full name and shipping country so we can tailor quotes. Google sign-in is supported.',
    img: 'laptop,signup',
    lock: 3,
    caption: 'Sign up online in minutes from any device.',
  },
  {
    title: 'Deposit',
    body: 'Place a refundable security deposit before bidding on higher-value lots. It confirms you are a genuine buyer and is credited toward your purchase or refunded if you do not win.',
    img: 'wallet,money',
    lock: 9,
    caption: 'A refundable deposit unlocks bidding on premium lots.',
  },
  {
    title: 'Purchase process',
    body: 'Browse live lots, watch the countdown, and place bids. Winning bids are locked into a tamper-evident, signed ledger, so there is never a dispute about who bid what.',
    img: 'car,dealership',
    lock: 15,
    caption: 'Bid in real time and watch the countdown on each lot.',
  },
  {
    title: 'Payment',
    body: 'Pay the winning amount into escrow. Funds are held by Yamkela and only released to the seller once you confirm the vehicle has been collected or delivered.',
    img: 'creditcard,payment',
    lock: 22,
    caption: 'Funds sit safely in escrow until you confirm delivery.',
  },
  {
    title: 'Transportation & shipping',
    body: 'Choose RoRo, container or air freight to your destination port. Our logistics desk books inland transport, ocean or air, insurance and documentation end to end.',
    img: 'car,port,ship',
    lock: 28,
    caption: 'We book your car onto the vessel and track it to port.',
  },
  {
    title: 'Fees',
    body: 'A transparent buyer fee applies per vehicle, plus shipping and any destination duties. All charges are itemised up front with no hidden mark-ups.',
    img: 'invoice,calculator',
    lock: 35,
    caption: 'Every charge is itemised up front, no surprises.',
  },
];

const memberships = [
  {
    tier: 'Guest',
    price: 'Free',
    perks: ['Browse all live lots', 'Watch auctions', 'Brand & country search'],
  },
  {
    tier: 'Verified buyer',
    price: 'Free · deposit required',
    perks: ['Place bids', 'Escrow-protected payment', 'Standard shipping rates'],
    featured: true,
  },
  {
    tier: 'Dealer',
    price: 'Contact us',
    perks: ['Bulk bidding', 'Priority logistics', 'Dedicated account manager'],
  },
];

export default function HowToBuyPage() {
  return (
    <div>
      <PageHero
        eyebrow="How to buy"
        title="From sign-up to your driveway"
        subtitle="Buying a car overseas should feel as safe as buying down the road. Here is exactly how it works on Yamkela Motors."
      />

      <section className="mb-12">
        <span className="eyebrow">The process</span>
        <h2 className="mt-1 mb-5 font-display text-2xl font-bold tracking-tight text-fg">
          Six steps, fully protected
        </h2>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="overflow-hidden rounded-xl border border-line/80 bg-surface shadow-lot"
            >
              <figure className="relative aspect-[16/9] w-full overflow-hidden bg-ink">
                <FallbackImage
                  src={`https://loremflickr.com/640/360/${s.img}?lock=${s.lock}`}
                  alt={s.title}
                  className="h-full w-full object-cover"
                />
                <span className="readout absolute left-3 top-3 rounded-md bg-ink/85 px-2 py-1 text-sm font-bold text-paper">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent px-3 pb-2 pt-8 text-xs font-medium text-paper">
                  {s.caption}
                </figcaption>
              </figure>
              <div className="p-5">
                <h3 className="font-display font-bold text-fg">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-12 rounded-2xl border border-line/80 bg-surface p-6 shadow-lot sm:p-8">
        <span className="eyebrow">Safety advice</span>
        <h2 className="mt-1 mb-4 font-display text-2xl font-bold tracking-tight text-fg">
          Stay protected
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            'Only ever pay into Yamkela escrow. We never ask you to wire money directly to a seller.',
            'Yamkela staff will never request your password, card PIN or full banking details by email or phone.',
            'Ignore anyone offering an "off-platform" discount. It is the classic fraud pattern.',
            'Check the signed bid history on each lot. A verified chain means the price is genuine.',
          ].map((tip) => (
            <li key={tip} className="flex gap-2.5 text-sm text-muted">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-racing" />
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-4">
        <span className="eyebrow">Membership levels</span>
        <h2 className="mt-1 mb-5 font-display text-2xl font-bold tracking-tight text-fg">
          Pick your level
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {memberships.map((m) => (
            <div
              key={m.tier}
              className={`rounded-xl border p-6 shadow-lot ${
                m.featured ? 'border-redline bg-surface' : 'border-line/80 bg-surface'
              }`}
            >
              {m.featured && (
                <span className="eyebrow rounded-full bg-redline/10 px-2.5 py-1 !text-redline">
                  Most popular
                </span>
              )}
              <h3 className="mt-3 font-display text-xl font-bold text-fg">{m.tier}</h3>
              <p className="readout mt-1 text-sm text-muted">{m.price}</p>
              <ul className="mt-4 space-y-2">
                {m.perks.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-racing" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary">
            Browse live lots
          </Link>
          <Link href="/shipping" className="btn-ghost">
            See shipping options
          </Link>
        </div>
      </section>
    </div>
  );
}
