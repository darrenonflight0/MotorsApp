'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import { useShallow } from 'zustand/react/shallow';
import FallbackImage from './FallbackImage';

// Body styles with representative photography (LoremFlickr, open-license, locked
// seed so each tile is stable). Selecting a type runs a search on the inventory.
const types = [
  { label: 'Sedan', term: 'Sedan', img: 'sedan,car', lock: 12 },
  { label: 'SUV', term: 'SUV', img: 'suv,car', lock: 21 },
  { label: 'Coupe', term: 'Coupe', img: 'coupe,car', lock: 33 },
  { label: 'Hatchback', term: 'Hatchback', img: 'hatchback,car', lock: 44 },
  { label: 'Pickup', term: 'Pickup', img: 'pickup,truck', lock: 51 },
  { label: 'Convertible', term: 'Convertible', img: 'convertible,car', lock: 66 },
  { label: 'Sports', term: 'Sports', img: 'sportscar', lock: 77 },
  { label: 'Electric', term: 'Electric', img: 'electric,car', lock: 88 },
  { label: 'Off-road', term: '4x4', img: 'offroad,jeep', lock: 91 },
  { label: 'Van', term: 'Van', img: 'van,vehicle', lock: 14 },
  { label: 'Wagon', term: 'Wagon', img: 'stationwagon,car', lock: 27 },
  { label: 'Motorcycle', term: 'Motorcycle', img: 'motorcycle', lock: 39 },
];

export default function BrowseByType() {
  const { searchTerm, setParams } = useParamsStore(
    useShallow((state) => ({
      searchTerm: state.searchTerm,
      setParams: state.setParams,
    }))
  );

  function pick(term: string) {
    setParams({ searchTerm: term, filterBy: '', country: '' });
    document.getElementById('lots')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="mb-10">
      <div className="mb-4">
        <span className="eyebrow">Browse by body style</span>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-fg">
          What are you driving home?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {types.map((t) => {
          const active = searchTerm.toLowerCase() === t.term.toLowerCase();
          return (
            <button
              key={t.label}
              onClick={() => pick(t.term)}
              aria-pressed={active}
              className={`group relative aspect-[4/3] overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline ${
                active ? 'border-redline shadow-lot-hover' : 'border-line/80 shadow-lot hover:border-line/40'
              }`}
            >
              <FallbackImage
                src={`https://loremflickr.com/400/300/${t.img}?lock=${t.lock}`}
                alt={`${t.label} vehicles`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <span className="absolute bottom-2.5 left-3 font-display text-sm font-bold uppercase tracking-wide text-paper">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
