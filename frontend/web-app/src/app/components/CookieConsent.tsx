'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/**
 * GDPR / CCPA cookie-consent banner.
 *
 * Privacy-first by design: nothing beyond strictly-necessary cookies is set
 * until the visitor makes a choice, "Reject" is presented as prominently as
 * "Accept", and the granular analytics toggle defaults to OFF. The decision is
 * stored locally so the banner only reappears when consent is withdrawn or the
 * policy version changes.
 */
const STORAGE_KEY = 'yamkela-cookie-consent';
const POLICY_VERSION = 1;

export type CookieConsentValue = {
  version: number;
  essential: true;
  analytics: boolean;
  decidedAt: string;
};

export function getStoredConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentValue;
    return parsed.version === POLICY_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // Only decide visibility on the client to avoid a hydration mismatch.
    if (!getStoredConsent()) setVisible(true);
  }, []);

  function persist(consent: { analytics: boolean }) {
    const value: CookieConsentValue = {
      version: POLICY_VERSION,
      essential: true,
      analytics: consent.analytics,
      decidedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      /* storage unavailable — respect the choice for this session only */
    }
    // Let any listeners (e.g. analytics loaders) react to the new consent.
    window.dispatchEvent(new CustomEvent('yamkela:consent', { detail: value }));
    setVisible(false);
  }

  // Conditional render (rather than AnimatePresence exit) so that once a choice
  // is made the banner unmounts cleanly and never lingers as an invisible,
  // click-intercepting node at the bottom of the viewport.
  if (!visible) return null;

  return (
    <>
        <motion.div
          key="cookie-consent"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-line/80 bg-surface/95 p-5 shadow-lot-hover backdrop-blur sm:inset-x-6 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <p className="font-display text-sm font-bold text-fg">We value your privacy</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                We use strictly-necessary cookies to run Yamkela Motors (sign-in, security,
                your watchlist). With your consent we also use optional analytics cookies to
                understand how the marketplace is used. You can change your choice at any time. See
                our{' '}
                <Link href="/cookies" className="font-medium text-redline hover:text-redline-deep">
                  Cookie Policy
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-medium text-redline hover:text-redline-deep">
                  Privacy Policy
                </Link>
                .
              </p>

              <AnimatePresence initial={false}>
                {showPrefs && (
                  <motion.label
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 flex items-center gap-3 overflow-hidden text-sm text-muted"
                  >
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="h-4 w-4 accent-redline"
                    />
                    <span>
                      <span className="font-semibold text-fg">Analytics cookies</span> — help us
                      improve the platform (optional, off by default).
                    </span>
                  </motion.label>
                )}
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
              <button onClick={() => persist({ analytics: true })} className="btn-primary text-sm">
                Accept all
              </button>
              <button
                onClick={() => persist({ analytics: false })}
                className="btn-ghost text-sm"
              >
                Reject non-essential
              </button>
              {showPrefs ? (
                <button
                  onClick={() => persist({ analytics })}
                  className="text-sm font-medium text-muted underline-offset-2 hover:text-fg hover:underline"
                >
                  Save choices
                </button>
              ) : (
                <button
                  onClick={() => setShowPrefs(true)}
                  className="text-sm font-medium text-muted underline-offset-2 hover:text-fg hover:underline"
                >
                  Preferences
                </button>
              )}
            </div>
          </div>
        </motion.div>
    </>
  );
}
