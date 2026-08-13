'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';

// Brand marks are served from Simple Icons (simpleicons.org), an open-license
// SVG logo CDN. `slug` is the icon id; `name` is what we search the make on.
// Any logo that 404s falls back to the wordmark, so the row never looks broken.
// `ev` flags electric / new-energy marques so the tile shows an EV badge.
type Brand = { name: string; slug: string; ev?: boolean };

const brands: Brand[] = [
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Ford', slug: 'ford' },
  { name: 'BMW', slug: 'bmw' },
  { name: 'Mercedes', slug: 'mercedes' },
  { name: 'Audi', slug: 'audi' },
  { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Porsche', slug: 'porsche' },
  { name: 'Ferrari', slug: 'ferrari' },
  { name: 'Lamborghini', slug: 'lamborghini' },
  { name: 'Honda', slug: 'honda' },
  { name: 'Nissan', slug: 'nissan' },
  { name: 'Mazda', slug: 'mazda' },
  { name: 'Subaru', slug: 'subaru' },
  { name: 'Mitsubishi', slug: 'mitsubishi' },
  { name: 'Suzuki', slug: 'suzuki' },
  { name: 'Lexus', slug: 'lexus' },
  { name: 'Tesla', slug: 'tesla', ev: true },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Kia', slug: 'kia' },
  { name: 'Genesis', slug: 'genesis' },
  { name: 'Volvo', slug: 'volvo' },
  { name: 'Jaguar', slug: 'jaguar' },
  { name: 'Land Rover', slug: 'landrover' },
  { name: 'Bentley', slug: 'bentley' },
  { name: 'Rolls-Royce', slug: 'rollsroyce' },
  { name: 'Aston Martin', slug: 'astonmartin' },
  { name: 'Maserati', slug: 'maserati' },
  { name: 'Bugatti', slug: 'bugatti' },
  { name: 'Chevrolet', slug: 'chevrolet' },
  { name: 'Jeep', slug: 'jeep' },
  { name: 'Dodge', slug: 'dodge' },
  { name: 'Cadillac', slug: 'cadillac' },
  { name: 'Peugeot', slug: 'peugeot' },
  { name: 'Renault', slug: 'renault' },
  { name: 'Citroën', slug: 'citroen' },
  { name: 'Fiat', slug: 'fiat' },
  { name: 'Alfa Romeo', slug: 'alfaromeo' },
  { name: 'Mini', slug: 'mini' },
  { name: 'Škoda', slug: 'skoda' },

  // ── Chinese new-energy / EV marques ──
  { name: 'BYD', slug: 'byd', ev: true },
  { name: 'NIO', slug: 'nio', ev: true },
  { name: 'XPeng', slug: 'xpeng', ev: true },
  { name: 'Li Auto', slug: 'liauto', ev: true },
  { name: 'Zeekr', slug: 'zeekr', ev: true },
  { name: 'Xiaomi', slug: 'xiaomi', ev: true },
  { name: 'Geely', slug: 'geely', ev: true },
  { name: 'GAC Aion', slug: 'aion', ev: true },
  { name: 'Leapmotor', slug: 'leapmotor', ev: true },
  { name: 'Hongqi', slug: 'hongqi', ev: true },
  { name: 'Wuling', slug: 'wuling', ev: true },
  { name: 'Great Wall', slug: 'greatwallmotors', ev: true },
  { name: 'Chery', slug: 'chery', ev: true },
  { name: 'MG', slug: 'mg', ev: true },
  { name: 'Changan', slug: 'changan', ev: true },
  { name: 'Lynk & Co', slug: 'lynkco', ev: true },
  { name: 'Denza', slug: 'denza', ev: true },
  { name: 'Avatr', slug: 'avatr', ev: true },

  // ── Japanese EV / electrified lines ──
  { name: 'Nissan Ariya', slug: 'nissan', ev: true },
  { name: 'Toyota bZ', slug: 'toyota', ev: true },
  { name: 'Lexus RZ', slug: 'lexus', ev: true },
  { name: 'Honda e', slug: 'honda', ev: true },
  { name: 'Subaru Solterra', slug: 'subaru', ev: true },
  { name: 'Mazda MX-30', slug: 'mazda', ev: true },
];

// Slugs actually present in Simple Icons today. Many car marques have been
// removed from the set for trademark reasons, and requesting a missing one 404s
// (harmless, but it spams the console). Brands not listed here render a clean
// monogram instead of firing a doomed request; listed ones still fall back to the
// monogram via onError if the icon is ever pulled.
const LOGO_SLUGS = new Set([
  'toyota', 'ford', 'bmw', 'audi', 'volkswagen', 'porsche', 'ferrari', 'lamborghini',
  'honda', 'nissan', 'mazda', 'subaru', 'mitsubishi', 'suzuki', 'tesla', 'hyundai',
  'kia', 'volvo', 'bentley', 'rollsroyce', 'astonmartin', 'maserati', 'bugatti',
  'chevrolet', 'jeep', 'cadillac', 'peugeot', 'renault', 'citroen', 'fiat', 'mini',
  'skoda', 'xiaomi', 'mg',
]);

function BrandTile({
  name,
  slug,
  ev,
  active,
  onPick,
}: {
  name: string;
  slug: string;
  ev?: boolean;
  active: boolean;
  onPick: () => void;
}) {
  // Start with the logo only if the icon actually exists; otherwise go straight
  // to the monogram so no doomed request is ever made.
  const [logoOk, setLogoOk] = useState(() => LOGO_SLUGS.has(slug));

  return (
    <button
      onClick={onPick}
      aria-pressed={active}
      title={ev ? `${name} — electric / new energy` : name}
      className={`group relative flex aspect-square w-24 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-xl border bg-surface p-3 transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline sm:w-auto ${
        active
          ? 'border-redline shadow-lot-hover'
          : 'border-line/80 shadow-lot hover:border-line/40'
      }`}
    >
      {ev && (
        <span
          aria-hidden
          className="absolute right-1.5 top-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-display text-[8px] font-bold uppercase tracking-wide text-emerald-600"
        >
          EV
        </span>
      )}
      {logoOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://cdn.simpleicons.org/${slug}/363c45`}
          alt={`${name} logo`}
          width={36}
          height={36}
          loading="lazy"
          onError={() => setLogoOk(false)}
          className="h-8 w-8 object-contain opacity-80 transition-opacity group-hover:opacity-100"
        />
      ) : (
        <span className="flex h-8 items-center font-display text-base font-black text-muted">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="line-clamp-1 text-center font-display text-[11px] font-semibold text-muted group-hover:text-fg">
        {name}
      </span>
    </button>
  );
}

export default function BrowseByBrand() {
  const { searchTerm, setParams, reset } = useParamsStore(
    useShallow((state) => ({
      searchTerm: state.searchTerm,
      setParams: state.setParams,
      reset: state.reset,
    }))
  );

  function pick(query: string) {
    setParams({ searchTerm: query, filterBy: '' });
    document.getElementById('lots')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <span className="eyebrow">Browse by marque</span>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-fg">
            Shop by brand
          </h2>
        </div>
        {searchTerm && (
          <button
            onClick={() => reset()}
            className="text-sm font-medium text-redline transition-colors hover:text-redline-deep"
          >
            Clear ({searchTerm})
          </button>
        )}
      </div>

      {/* Horizontal scroll strip on small screens, wraps to a grid on large */}
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin] sm:grid sm:grid-cols-6 sm:overflow-visible lg:grid-cols-8">
        {brands.map((brand) => (
          <BrandTile
            key={brand.name}
            name={brand.name}
            slug={brand.slug}
            ev={brand.ev}
            active={searchTerm.toLowerCase() === brand.name.toLowerCase()}
            onPick={() => pick(brand.name)}
          />
        ))}
      </div>
    </section>
  );
}
