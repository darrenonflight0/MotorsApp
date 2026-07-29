import { HiBadgeCheck } from 'react-icons/hi';

type Props = {
  verified?: boolean;
  /** 'tick' = just the blue check; 'badge' = check + label pill. */
  variant?: 'tick' | 'badge';
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * The verification indicator shown next to auctioneers' names and on listings.
 * A verified user gets the blue tick; unverified renders a muted "Unverified"
 * pill only in the `badge` variant (nothing in `tick` variant).
 */
export default function VerifiedBadge({ verified, variant = 'tick', size = 'md', className = '' }: Props) {
  const tick = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  if (variant === 'tick') {
    if (!verified) return null;
    return (
      <HiBadgeCheck
        className={`inline-block shrink-0 text-sky-500 ${tick} ${className}`}
        title="Verified auctioneer"
        aria-label="Verified auctioneer"
      />
    );
  }

  // badge variant
  return verified ? (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-semibold text-sky-600 ${className}`}
    >
      <HiBadgeCheck className="h-3.5 w-3.5" /> Verified Auctioneer
    </span>
  ) : (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-line/60 px-2 py-0.5 text-xs font-semibold text-muted ${className}`}
    >
      Unverified
    </span>
  );
}
