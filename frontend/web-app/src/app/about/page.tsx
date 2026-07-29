import PageHero from '../components/PageHero';
import FallbackImage from '../components/FallbackImage';

export const metadata = {
  title: 'About us · Yamkela Motors',
  description: 'Who we are and why Yamkela Motors makes cross-border car auctions safe.',
};

const stats = [
  { value: '6', label: 'Source countries' },
  { value: '100%', label: 'Escrow-protected sales' },
  { value: '24/7', label: 'Live bidding' },
];

const values = [
  {
    title: 'Trust by design',
    body: 'Every bid is cryptographically signed and chained. Every payment runs through escrow. Fraud has nowhere to hide.',
  },
  {
    title: 'One price, no surprises',
    body: 'Buyer fees, shipping and duties are itemised up front. What you are quoted is what you pay.',
  },
  {
    title: 'Global, but local',
    body: 'Source a car from Japan, the USA, China, Canada, South Africa or Ghana and receive it at your nearest port.',
  },
];

export default function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="About us"
        title="Cross-border car buying, without the risk"
        subtitle="Yamkela Motors is a live vehicle auction and export platform built around one idea: buying a car from another country should be as safe as buying it next door."
      />

      <section className="mb-12 grid gap-6 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-line/80 bg-surface p-6 text-center shadow-lot"
          >
            <div className="readout text-4xl font-bold text-redline">{s.value}</div>
            <div className="eyebrow mt-2">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="mb-12 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <span className="eyebrow">Our story</span>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-fg">
            Built for buyers who can&apos;t stand next to the car
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            Importing a vehicle used to mean trusting a stranger with your money and hoping the
            car matched the photos. Yamkela was built to remove that leap of faith. We combine a
            transparent live auction, a tamper-evident bidding ledger, escrow-held payments and a
            single logistics desk that moves your car from the auction block to your destination
            port.
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            Whether you are a first-time importer or a dealer moving volume, you get the same
            protection: verified identities, signed bids, and money that only changes hands when
            you say the car has arrived.
          </p>
        </div>
        <div className="aspect-[5/4] overflow-hidden rounded-xl border border-line/80 bg-ink shadow-lot">
          <FallbackImage
            src="https://loremflickr.com/700/560/cars,port,shipping?lock=5"
            alt="Vehicles staged at an export port"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="mb-4">
        <span className="eyebrow">What we stand for</span>
        <h2 className="mt-1 mb-5 font-display text-2xl font-bold tracking-tight text-fg">
          Our principles
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-xl border border-line/80 bg-surface p-6 shadow-lot"
            >
              <h3 className="font-display font-bold text-fg">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{v.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
