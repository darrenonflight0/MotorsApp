import LegalDoc, { LegalSection } from '../components/LegalDoc';

export const metadata = {
  title: 'Cookie Policy · Yamkela Motors',
  description:
    'Exactly which cookies and local storage Yamkela Motors uses, what each one does, how long it lasts, and how to control them.',
};

type Row = { name: string; purpose: string; type: string; duration: string };

const necessary: Row[] = [
  {
    name: 'next-auth.session-token',
    purpose: 'Keeps you securely signed in to your account.',
    type: 'Cookie (first-party)',
    duration: 'Session · up to 30 days',
  },
  {
    name: 'next-auth.csrf-token',
    purpose: 'Protects the sign-in flow from cross-site request forgery.',
    type: 'Cookie',
    duration: 'Session',
  },
  {
    name: 'next-auth.callback-url',
    purpose: 'Returns you to the right page after logging in.',
    type: 'Cookie',
    duration: 'Session',
  },
  {
    name: 'idsrv.session · .AspNetCore.Identity.Application',
    purpose: 'Your sign-in session on the Yamkela identity server.',
    type: 'Cookie',
    duration: 'Session',
  },
];

const functional: Row[] = [
  {
    name: 'yamkela-cookie-consent',
    purpose: 'Remembers your cookie choices so we don’t ask again.',
    type: 'Local storage',
    duration: 'Until you clear it',
  },
  {
    name: 'yamkela-watchlist',
    purpose: 'Stores the cars you save to your watchlist.',
    type: 'Local storage',
    duration: 'Until you clear it',
  },
  {
    name: 'yamkela-theme',
    purpose: 'Remembers your light / dark mode preference.',
    type: 'Local storage',
    duration: 'Until you clear it',
  },
  {
    name: 'yamkela-last-visit',
    purpose: 'Shows a “welcome back” greeting and recent activity.',
    type: 'Local storage',
    duration: 'Until you clear it',
  },
];

function CookieTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line/70">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="bg-canvas text-[11px] uppercase tracking-wide text-muted">
          <tr>
            <th className="p-3 font-semibold">Name</th>
            <th className="p-3 font-semibold">Purpose</th>
            <th className="p-3 font-semibold">Type</th>
            <th className="p-3 font-semibold">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {rows.map((r) => (
            <tr key={r.name} className="align-top">
              <td className="p-3 font-mono text-xs text-fg">{r.name}</td>
              <td className="p-3 text-muted">{r.purpose}</td>
              <td className="p-3 text-muted">{r.type}</td>
              <td className="p-3 text-muted">{r.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiePolicyPage() {
  return (
    <LegalDoc
      eyebrow="Cookie Policy"
      title="Cookies & local storage"
      subtitle="We keep this short and honest: only what’s needed to run the marketplace is set by default. Optional analytics are off until you opt in. Here is every cookie and storage item we use."
      updated="30 July 2026"
    >
      <LegalSection heading="1. What these are">
        <p>
          Cookies are small files a site stores in your browser; “local storage” is a similar
          browser mechanism we use for preferences. Together they let us keep you signed in,
          remember your choices, and run the site securely. We do <strong>not</strong> use them to
          sell your data or track you across other websites.
        </p>
      </LegalSection>

      <LegalSection heading="2. Strictly necessary">
        <p>
          Required for the site to function — sign-in, security, and session handling. These
          can’t be switched off, and no consent is required for them.
        </p>
        <CookieTable rows={necessary} />
      </LegalSection>

      <LegalSection heading="3. Functional (preferences)">
        <p>
          Stored in your browser to remember your choices. They stay on your device and are never
          sent to third parties.
        </p>
        <CookieTable rows={functional} />
      </LegalSection>

      <LegalSection heading="4. Analytics (optional)">
        <p>
          We currently run <strong>no third-party analytics or advertising cookies</strong>. If we
          ever add analytics, they will only be set <strong>after you opt in</strong> via the
          consent banner — off by default, and you can withdraw at any time.
        </p>
      </LegalSection>

      <LegalSection heading="5. Managing your choices">
        <ul>
          <li>
            Use the <strong>cookie consent banner</strong> (Accept, Reject, or Preferences) when you
            first visit — your choice is remembered.
          </li>
          <li>
            To change or withdraw consent later, clear the <code>yamkela-cookie-consent</code> item
            in your browser storage (or all site data) and the banner returns.
          </li>
          <li>
            Your browser settings also let you block or delete cookies and local storage — note that
            blocking strictly-necessary ones will stop sign-in from working.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="6. More information">
        <p>
          This page complements our{' '}
          <a href="/privacy">Privacy &amp; Cookie Policy</a>, which explains your GDPR/CCPA rights and
          how we handle personal data. Questions? Email{' '}
          <a href="mailto:privacy@yamkelamotors.example">privacy@yamkelamotors.example</a>.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
