import LegalDoc, { LegalSection } from '../components/LegalDoc';

export const metadata = {
  title: 'Privacy & Cookie Policy · Yamkela Motors',
  description:
    'How Yamkela Motors collects, uses and protects your data, our cookie categories, and your rights under GDPR and CCPA.',
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="Privacy & Cookies"
      title="Your data, your rights"
      subtitle="We collect only what we need to run a safe marketplace, we tell you why, and we give you control. This policy explains how — including your rights under GDPR and CCPA."
      updated="21 July 2026"
    >
      <LegalSection heading="1. What we collect and why">
        <ul>
          <li>
            <strong>Account data</strong> (name, username, email) — to create and secure your
            account and attribute bids and listings.
          </li>
          <li>
            <strong>Transaction data</strong> (bids, auctions, escrow status) — to operate the
            marketplace and keep a tamper-evident record.
          </li>
          <li>
            <strong>Technical data</strong> (essential cookies, session tokens, IP for security) —
            to keep you signed in and to detect fraud and abuse.
          </li>
          <li>
            <strong>Optional analytics</strong> — only if you consent — to understand how the
            platform is used and improve it.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. Cookies">
        <p>We use two categories of cookies:</p>
        <ul>
          <li>
            <strong>Strictly necessary</strong> — sign-in, security, and your watchlist. These are
            required for the site to work and cannot be switched off.
          </li>
          <li>
            <strong>Analytics (optional)</strong> — set only after you opt in via the consent
            banner. They are off by default and you can withdraw consent at any time by clearing the
            banner choice in your browser storage.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Legal bases (GDPR)">
        <p>
          Where GDPR applies, we process your data on these bases: <strong>contract</strong> (to
          provide the service you sign up for), <strong>legitimate interests</strong> (security and
          fraud prevention), <strong>legal obligation</strong> (record-keeping), and{' '}
          <strong>consent</strong> (optional analytics). You may withdraw consent at any time.
        </p>
      </LegalSection>

      <LegalSection heading="4. Your rights">
        <p>Depending on where you live, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you and request a copy (portability).</li>
          <li>Correct inaccurate data or complete incomplete data.</li>
          <li>Delete your data (&ldquo;right to be forgotten&rdquo;), subject to legal retention.</li>
          <li>Object to or restrict certain processing, and withdraw consent.</li>
          <li>
            <strong>Under CCPA:</strong> know what we collect, request deletion, and opt out — we do{' '}
            <strong>not</strong> sell your personal information.
          </li>
        </ul>
        <p>
          To exercise any right, contact us at{' '}
          <a href="mailto:privacy@yamkelamotors.example">privacy@yamkelamotors.example</a>.
        </p>
      </LegalSection>

      <LegalSection heading="5. How we protect your data">
        <p>
          Passwords are hashed with BCrypt, access tokens are short-lived, and sensitive actions are
          rate-limited and monitored. If a data breach ever affects your personal data, we will
          notify affected users and the relevant regulators as required by law.
        </p>
      </LegalSection>

      <LegalSection heading="6. Retention and international transfers">
        <p>
          We keep personal data only as long as needed to provide the service and meet legal
          obligations, then delete or anonymise it. Where data crosses borders, we use appropriate
          safeguards for the transfer.
        </p>
      </LegalSection>

      <LegalSection heading="7. Contact">
        <p>
          Questions about privacy? Email{' '}
          <a href="mailto:privacy@yamkelamotors.example">privacy@yamkelamotors.example</a>. See also
          our <a href="/terms">Terms of Service</a>.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
