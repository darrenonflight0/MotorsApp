'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import { useShallow } from 'zustand/react/shallow';
import FallbackImage from './FallbackImage';

// Body styles with representative photography, self-hosted in /public/body-styles
// (Wikimedia Commons, CC-licensed) so tiles don't depend on a flaky image API. Selecting a type runs a search on the inventory.
// `type` must match the value stored on a listing (AuctionForm's vehicle types).
const types = [
  { label: 'Sedan', type: 'Sedan', img: '/body-styles/sedan.jpg' },
  { label: 'SUV', type: 'SUV', img: '/body-styles/suv.jpg' },
  { label: 'Coupe', type: 'Coupe', img: '/body-styles/coupe.jpg' },
  { label: 'Hatchback', type: 'Hatchback', img: '/body-styles/hatchback.jpg' },
  { label: 'Pickup', type: 'Pickup', img: '/body-styles/pickup.jpg' },
  { label: 'Convertible', type: 'Convertible', img: '/body-styles/convertible.jpg' },
  { label: 'Sports', type: 'Sports', img: '/body-styles/sports.jpg' },
  { label: 'Electric', type: 'Electric', img: '/body-styles/electric.jpg' },
  { label: 'Off-road', type: 'Off-road', img: '/body-styles/offroad.jpg' },
  { label: 'Van', type: 'Van', img: '/body-styles/van.jpg' },
  { label: 'Wagon', type: 'Wagon', img: '/body-styles/wagon.jpg' },
  { label: 'Motorcycle', type: 'Motorcycle', img: '/body-styles/motorcycle.jpg' },
];

export default function BrowseByType() {
  const { vehicleType, setParams } = useParamsStore(
    useShallow((state) => ({
      vehicleType: state.vehicleType,
      setParams: state.setParams,
    }))
  );

  function pick(type: string) {
    // Toggle off if the same type is clicked again.
    setParams({ vehicleType: vehicleType === type ? '' : type, searchTerm: '', filterBy: 'live', country: '' });
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
          const active = vehicleType === t.type;
          return (
            <button
              key={t.label}
              onClick={() => pick(t.type)}
              aria-pressed={active}
              className={`group relative aspect-[4/3] overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline ${
                active ? 'border-redline shadow-lot-hover' : 'border-line/80 shadow-lot hover:border-line/40'
              }`}
            >
              <FallbackImage
                src={t.img}
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
