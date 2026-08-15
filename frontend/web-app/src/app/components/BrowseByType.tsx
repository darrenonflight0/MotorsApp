'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import { useShallow } from 'zustand/react/shallow';
import FallbackImage from './FallbackImage';

// Body styles with representative photography (LoremFlickr, open-license, locked
// seed so each tile is stable). Selecting a type runs a search on the inventory.
// `type` must match the value stored on a listing (AuctionForm's vehicle types).
const types = [
  { label: 'Sedan', type: 'Sedan', img: 'sedan,car', lock: 12 },
  { label: 'SUV', type: 'SUV', img: 'suv,car', lock: 21 },
  { label: 'Coupe', type: 'Coupe', img: 'coupe,car', lock: 33 },
  { label: 'Hatchback', type: 'Hatchback', img: 'hatchback,car', lock: 44 },
  { label: 'Pickup', type: 'Pickup', img: 'pickup,truck', lock: 51 },
  { label: 'Convertible', type: 'Convertible', img: 'convertible,car', lock: 66 },
  { label: 'Sports', type: 'Sports', img: 'sportscar', lock: 77 },
  { label: 'Electric', type: 'Electric', img: 'electric,car', lock: 88 },
  { label: 'Off-road', type: 'Off-road', img: 'offroad,jeep', lock: 91 },
  { label: 'Van', type: 'Van', img: 'van,vehicle', lock: 14 },
  { label: 'Wagon', type: 'Wagon', img: 'stationwagon,car', lock: 27 },
  { label: 'Motorcycle', type: 'Motorcycle', img: 'motorcycle', lock: 39 },
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
