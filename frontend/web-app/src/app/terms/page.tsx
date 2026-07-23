import LegalDoc, { LegalSection } from '../components/LegalDoc';

export const metadata = {
  title: 'Terms of Service · Yamkela Motors',
  description:
    'The rules of the Yamkela Motors marketplace — our role as facilitator, seller and buyer obligations, pricing transparency and prohibited conduct.',
};

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="Terms of Service"
      title="The rules of the marketplace"
      subtitle="These terms govern your use of Yamkela Motors. They define our role, your responsibilities, and the safeguards that keep the marketplace honest."
      updated="21 July 2026"
    >
      <LegalSection heading="1. Our role — a facilitator, not a party to the sale">
        <p>
          Yamkela Motors operates a consumer-to-consumer (C2C) online auction venue. We provide the
          technology that lets sellers list vehicles and buyers bid on them. <strong>We are not the
          buyer or the seller in any transaction, and we do not take title to any vehicle.</strong>{' '}
          Each sale is a direct contract between the seller and the winning bidder.
        </p>
        <p>
          Because we merely facilitate transactions, we are not responsible for the condition,
          legality, safety, or fitness of any vehicle, nor for either party&apos;s performance of the
          sale. We do, however, operate the safeguards described below to reduce risk for everyone.
        </p>
      </LegalSection>

      <LegalSection heading="2. Honest listings and fault disclosure">
        <p>
          Sellers must describe each vehicle truthfully and completely. Making false or misleading
          claims about a vehicle is prohibited and may be unlawful under consumer-protection law.
        </p>
        <ul>
          <li>
            Every listing must include a <strong>condition &amp; disclosure statement</strong>{' '}
            describing known faults, accident history, mechanical issues, and anything a reasonable
            buyer would want to know before purchase.
          </li>
          <li>Photographs must depict the actual vehicle being sold.</li>
          <li>
            Sellers warrant they hold clear legal title and the right to sell. Listing a stolen,
            cloned, or encumbered vehicle results in immediate removal and may be reported to law
            enforcement.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Transparent, total pricing — no junk fees">
        <p>
          We believe the price you see should be the price you pay. Any mandatory platform or buyer
          fee is disclosed <strong>up front, before you bid</strong>, and shown as part of the total
          amount payable.
        </p>
        <ul>
          <li>
            We do not add hidden documentation charges, &ldquo;conveyance&rdquo; fees, or mandatory
            add-ons buried in fine print.
          </li>
          <li>
            Genuine government taxes, duties, and registration fees vary by destination and are
            itemised separately (see the <a href="/shipping">Shipping &amp; duties</a> estimator).
          </li>
          <li>
            Advertised prices are achievable by an ordinary buyer and are never conditional on
            hard-to-qualify rebates.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. Identity verification and anti-fraud">
        <p>
          To protect the community, we may verify the identity of sellers and buyers and monitor
          activity for signs of fraud. Accounts are protected by secure password hashing, lockout
          on repeated failed sign-ins, and short-lived access tokens. Bids are cryptographically
          signed and recorded in a tamper-evident ledger.
        </p>
      </LegalSection>

      <LegalSection heading="5. Secure payments via escrow">
        <p>
          Funds for a completed auction are held in <strong>escrow</strong> and released to the
          seller only once the agreed conditions are met. This protects buyers from paying for a car
          they never receive and protects sellers from non-payment.
        </p>
      </LegalSection>

      <LegalSection heading="6. Prohibited conduct">
        <ul>
          <li>Deceptive, fraudulent, or misleading listings or claims.</li>
          <li>Selling vehicles you do not own or have no right to sell.</li>
          <li>Circumventing escrow or arranging off-platform payment to evade buyer protection.</li>
          <li>Manipulating bids (shill bidding), harassment, or abuse of other users.</li>
          <li>Any use of the platform for money laundering or other illegal activity.</li>
        </ul>
        <p>
          We may suspend or terminate accounts, cancel auctions, and report unlawful activity to the
          relevant authorities.
        </p>
      </LegalSection>

      <LegalSection heading="7. Disputes between buyers and sellers">
        <p>
          As a facilitator we are not a party to disputes, but our escrow and ledger records are
          available to help resolve them. Buyers and sellers agree to act in good faith and to use
          the platform&apos;s dispute process before pursuing other remedies.
        </p>
      </LegalSection>

      <LegalSection heading="8. Privacy">
        <p>
          Your use of Yamkela Motors is also governed by our{' '}
          <a href="/privacy">Privacy &amp; Cookie Policy</a>, which explains what data we collect,
          why, and the rights you have over it.
        </p>
      </LegalSection>

      <LegalSection heading="9. Changes to these terms">
        <p>
          We may update these terms as the platform and the law evolve. Material changes will be
          notified in-app, and continued use after the effective date constitutes acceptance.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
