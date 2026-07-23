'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';
import Listings from '../auctions/Listings';
import FallbackImage from '../components/FallbackImage';

// value must match the Country stored on the backend Item.
// `code` is the flagcdn ISO code; FX rates are indicative, not live.
const countries = [
  { name: 'Ghana', value: 'Ghana', code: 'gh', blurb: 'West Africa hub · Tema port', ccy: 'GHS', symbol: '₵', perUsd: 15.8 },
  { name: 'China', value: 'China', code: 'cn', blurb: 'New & used EVs · Shanghai', ccy: 'CNY', symbol: '¥', perUsd: 7.1 },
  { name: 'Japan', value: 'Japan', code: 'jp', blurb: 'JDM classics · Yokohama', ccy: 'JPY', symbol: '¥', perUsd: 150 },
  { name: 'USA', value: 'USA', code: 'us', blurb: 'Muscle & trucks · New York', ccy: 'USD', symbol: '$', perUsd: 1 },
  { name: 'Canada', value: 'Canada', code: 'ca', blurb: 'Low-rust imports · Halifax', ccy: 'CAD', symbol: 'C$', perUsd: 1.36 },
  { name: 'South Africa', value: 'South Africa', code: 'za', blurb: 'RHD market · Durban', ccy: 'ZAR', symbol: 'R', perUsd: 18.3 },
];

export default function CountryPicker() {
  const { country, setParams, reset } = useParamsStore(
    useShallow((state) => ({
      country: state.country,
      setParams: state.setParams,
      reset: state.reset,
    }))
  );
  const [usd, setUsd] = useState(10000);

  const selected = countries.find((c) => c.value === country);

  function pick(value: string) {
    setParams({ country: value, filterBy: '', searchTerm: '' });
    document.getElementById('country-lots')?.scrollIntoView({ behavior: 'smooth' });
  }

  const converted = selected
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(usd * selected.perUsd)
    : null;

  return (
    <>
      <section className="mb-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {countries.map((c) => {
            const active = country === c.value;
            return (
              <button
                key={c.value}
                onClick={() => pick(c.value)}
                aria-pressed={active}
                className={`group overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redline ${
                  active
                    ? 'border-redline shadow-lot-hover'
                    : 'border-chrome/80 shadow-lot hover:border-chrome-dark/40'
                }`}
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink">
                  <FallbackImage
                    src={`https://flagcdn.com/w640/${c.code}.png`}
                    alt={`Flag of ${c.name}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="readout absolute right-2 top-2 rounded-md bg-ink/85 px-2 py-1 text-xs font-bold text-paper">
                    {c.symbol} {c.ccy}
                  </span>
                </div>
                <div className="bg-paper-raised p-4">
                  <span className="font-display text-lg font-bold text-ink">{c.name}</span>
                  <span className="mt-0.5 block text-xs text-asphalt">{c.blurb}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section id="country-lots" className="scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
            {country ? `Vehicles from ${country}` : 'Select a country to view its inventory'}
          </h2>
          {country && (
            <button
              onClick={() => reset()}
              className="text-sm font-medium text-redline transition-colors hover:text-redline-deep"
            >
              Show all countries
            </button>
          )}
        </div>

        {selected && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-chrome/80 bg-paper-raised p-4 shadow-lot">
            <span className="eyebrow shrink-0">Currency converter</span>
            <div className="flex items-center gap-2">
              <span className="readout text-sm text-asphalt">US$</span>
              <input
                type="number"
                value={usd}
                min={0}
                onChange={(e) => setUsd(Math.max(0, Number(e.target.value)))}
                className="field-input readout w-32 !py-1.5"
              />
            </div>
            <span className="readout text-asphalt">≈</span>
            <span className="readout text-lg font-bold text-ink">
              {selected.symbol} {converted} <span className="text-sm font-medium text-asphalt">{selected.ccy}</span>
            </span>
            <span className="w-full text-xs text-asphalt sm:w-auto sm:border-l sm:border-chrome/70 sm:pl-3">
              Indicative rate. Bids and settlement are processed in US dollars.
            </span>
          </div>
        )}

        {country ? (
          <Listings />
        ) : (
          <div className="rounded-xl border border-dashed border-chrome-dark/30 bg-paper-raised/60 p-12 text-center text-asphalt">
            Pick a source market above to browse cars available for export from there.
          </div>
        )}
      </section>
    </>
  );
}
