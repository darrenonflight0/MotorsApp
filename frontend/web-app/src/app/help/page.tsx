import Link from 'next/link';
import PageHero from '../components/PageHero';
import Faq from './Faq';

export const metadata = {
  title: 'Help · Yamkela Motors',
  description: 'Answers to common questions and ways to reach the Yamkela Motors team.',
};

const channels = [
  {
    title: 'Buying & bidding',
    body: 'Questions about placing bids, deposits or winning a lot.',
    href: '/how-to-buy',
    cta: 'Read how to buy',
  },
  {
    title: 'Shipping & delivery',
    body: 'Freight methods, timelines and receiving your car at port.',
    href: '/shipping',
    cta: 'See shipping',
  },
  {
    title: 'Account & security',
    body: 'Sign-in, password reset and keeping your account safe.',
    href: '/about',
    cta: 'About our safeguards',
  },
];

export default function HelpPage() {
  return (
    <div>
      <PageHero
        eyebrow="Help centre"
        title="How can we help?"
        subtitle="Find quick answers below, or reach the team directly. We are here to make every purchase feel safe."
      />

      <section className="mb-12 grid gap-6 md:grid-cols-3">
        {channels.map((c) => (
          <div
            key={c.title}
            className="flex flex-col rounded-xl border border-chrome/80 bg-paper-raised p-6 shadow-lot"
          >
            <h3 className="font-display font-bold text-ink">{c.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-asphalt">{c.body}</p>
            <Link
              href={c.href}
              className="mt-4 text-sm font-semibold text-redline transition-colors hover:text-redline-deep"
            >
              {c.cta} &rarr;
            </Link>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <span className="eyebrow">FAQ</span>
        <h2 className="mt-1 mb-5 font-display text-2xl font-bold tracking-tight text-ink">
          Frequently asked
        </h2>
        <Faq />
      </section>

      <section className="mb-4 rounded-2xl bg-ink px-6 py-8 text-paper sm:px-10">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="eyebrow !text-chrome">Still stuck?</span>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
              Talk to the Yamkela team
            </h2>
            <p className="mt-2 max-w-xl text-sm text-chrome">
              Email us and a real person replies. We never ask for your password or card details.
            </p>
          </div>
          <a href="mailto:support@yamkela.local" className="btn-primary shrink-0">
            Email support
          </a>
        </div>
      </section>
    </div>
  );
}
