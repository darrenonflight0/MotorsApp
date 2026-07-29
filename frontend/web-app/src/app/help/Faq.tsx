'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'How do I place a bid?',
    a: 'Sign in, open a live lot, and enter your amount in the bid box. You must be a verified buyer and cannot bid on your own auction.',
  },
  {
    q: 'What is escrow and why does it protect me?',
    a: 'When you win, you pay into Yamkela escrow rather than to the seller directly. We hold the funds and only release them once you confirm the vehicle has been collected or delivered.',
  },
  {
    q: 'Which countries can I buy from?',
    a: 'You can source vehicles from Japan, the USA, China, Canada, South Africa and Ghana. Use the Shop by country page to filter inventory.',
  },
  {
    q: 'How is shipping priced?',
    a: 'Use the calculator on the Shipping page for an indicative quote by destination and method (RoRo, container or air). A binding quote is issued after your vehicle is won and inspected.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the sign-in page choose "Forgot password?", enter your email, and follow the secure link we send. The link expires quickly and can be used once.',
  },
  {
    q: 'How do I know a bid history is genuine?',
    a: 'Every bid is chained with SHA-256 and signed with our platform key. A verified chain on a lot means the price history has not been tampered with.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-chrome/70 overflow-hidden rounded-xl border border-line/80 bg-surface shadow-lot">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-canvas"
            >
              <span className="font-display font-semibold text-fg">{f.q}</span>
              <span
                className={`readout shrink-0 text-xl text-redline transition-transform ${
                  isOpen ? 'rotate-45' : ''
                }`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            {isOpen && (
              <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{f.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
