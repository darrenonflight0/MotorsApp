'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import { useShallow } from 'zustand/react/shallow';
import { useState } from 'react';
import { HiBadgeCheck } from 'react-icons/hi';
import Listings from '../auctions/Listings';
import FallbackImage from '../components/FallbackImage';

// value must match the Country stored on the backend Item.
// `code` is the flagcdn ISO code; FX rates are indicative, not live.
// Each market is served by ONE official Yamkela Motors distributor.
const countries = [
  { name: 'Ghana', value: 'Ghana', code: 'gh', blurb: 'West Africa hub · Tema port', ccy: 'GHS', symbol: '₵', perUsd: 15.8, distributor: { name: 'Accra Auto Exports', since: 2019, port: 'Tema' } },
  { name: 'China', value: 'China', code: 'cn', blurb: 'New & used EVs · Shanghai', ccy: 'CNY', symbol: '¥', perUsd: 7.1, distributor: { name: 'Shanghai EV Collective', since: 2021, port: 'Shanghai' } },
  { name: 'Japan', value: 'Japan', code: 'jp', blurb: 'JDM classics · Yokohama', ccy: 'JPY', symbol: '¥', perUsd: 150, distributor: { name: 'Yokohama JDM Traders', since: 2016, port: 'Yokohama' } },
  { name: 'USA', value: 'USA', code: 'us', blurb: 'Muscle & trucks · New York', ccy: 'USD', symbol: '$', perUsd: 1, distributor: { name: 'Liberty Motors Group', since: 2018, port: 'New York' } },
  { name: 'Canada', value: 'Canada', code: 'ca', blurb: 'Low-rust imports · Halifax', ccy: 'CAD', symbol: 'C$', perUsd: 1.36, distributor: { name: 'Maple Fleet Imports', since: 2020, port: 'Halifax' } },
  { name: 'South Africa', value: 'South Africa', code: 'za', blurb: 'RHD market · Durban', ccy: 'ZAR', symbol: 'R', perUsd: 18.3, distributor: { name: 'Durban Coastal Motors', since: 2017, port: 'Durban' } },
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
                    : 'border-line/80 shadow-lot hover:border-line/40'
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
                <div className="bg-surface p-4">
                  <span className="font-display text-lg font-bold text-fg">{c.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">{c.blurb}</span>
                  <span className="mt-1.5 block truncate text-[11px] font-medium text-muted">
                    via {c.distributor.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section id="country-lots" className="scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
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
          <div className="mb-4 flex items-center gap-4 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 shadow-lot">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg font-black text-paper">
              {selected.distributor.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-fg">{selected.distributor.name}</span>
                <HiBadgeCheck className="h-4 w-4 shrink-0 text-sky-500" title="Official distributor" />
              </div>
              <p className="text-xs text-muted">
                Official Yamkela Motors distributor for {selected.name} since {selected.distributor.since} ·
                ships from {selected.distributor.port}
              </p>
            </div>
          </div>
        )}

        {selected && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-line/80 bg-surface p-4 shadow-lot">
            <span className="eyebrow shrink-0">Currency converter</span>
            <div className="flex items-center gap-2">
              <span className="readout text-sm text-muted">US$</span>
              <input
                type="number"
                value={usd}
                min={0}
                onChange={(e) => setUsd(Math.max(0, Number(e.target.value)))}
                className="field-input readout w-32 !py-1.5"
              />
            </div>
            <span className="readout text-muted">≈</span>
            <span className="readout text-lg font-bold text-fg">
              {selected.symbol} {converted} <span className="text-sm font-medium text-muted">{selected.ccy}</span>
            </span>
            <span className="w-full text-xs text-muted sm:w-auto sm:border-l sm:border-line/70 sm:pl-3">
              Indicative rate. Bids and settlement are processed in US dollars.
            </span>
          </div>
        )}

        {country ? (
          <Listings />
        ) : (
          <div className="rounded-xl border border-dashed border-line/30 bg-surface/60 p-12 text-center text-muted">
            Pick a source market above to browse cars available for export from there.
          </div>
        )}
      </section>
    </>
  );
}
