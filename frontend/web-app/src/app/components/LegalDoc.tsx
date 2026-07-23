import { ReactNode } from 'react';
import PageHero from './PageHero';

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  updated: string;
  children: ReactNode;
};

/** Shared shell for policy pages (Terms, Privacy) — consistent hero + prose. */
export default function LegalDoc({ eyebrow, title, subtitle, updated, children }: Props) {
  return (
    <div>
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow mb-8">Last updated · {updated}</p>
        <div className="space-y-8">{children}</div>
        <p className="mt-12 rounded-xl border border-chrome/70 bg-paper-raised p-4 text-xs leading-relaxed text-asphalt">
          This summary is provided for transparency and does not constitute legal advice. Yamkela
          Motors operates as a neutral marketplace facilitator and is not a party to any sale
          between buyers and sellers.
        </p>
      </div>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold tracking-tight text-ink">{heading}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-asphalt [&_a]:font-medium [&_a]:text-redline hover:[&_a]:text-redline-deep [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}
