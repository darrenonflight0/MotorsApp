'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

export default function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const setParams = useParamsStore((state) => state.setParams);
  const setSearchValue = useParamsStore((state) => state.setSearchValue);
  const searchValue = useParamsStore((state) => state.searchValue);
  const [mode, setMode] = useState<'cars' | 'sellers'>('cars');

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(event.target.value);
  }

  function search() {
    const query = searchValue.trim();

    // Sellers mode: jump straight to that seller/auctioneer's showroom, where
    // their live lots are listed and can be opened and bid on.
    if (mode === 'sellers') {
      if (!query) return;
      const handle = query.replace(/^@+/, '');
      router.push(`/users/${encodeURIComponent(handle)}`);
      return;
    }

    if (pathname !== '/') router.push('/');
    setParams({ searchTerm: searchValue });
  }

  return (
    <div className="flex h-11 w-[60%] items-center rounded-full border border-line/25 bg-surface shadow-lot transition-colors focus-within:border-redline">
      <div className="ml-1.5 flex shrink-0 items-center rounded-full bg-canvas p-0.5">
        {(['cars', 'sellers'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1 font-display text-xs font-bold uppercase tracking-wide transition-colors ${
              mode === m ? 'bg-redline text-paper' : 'text-muted hover:text-fg'
            }`}
          >
            {m === 'cars' ? 'Cars' : 'Sellers'}
          </button>
        ))}
      </div>
      <input
        onKeyDown={(e) => {
          if (e.key === 'Enter') search();
        }}
        value={searchValue}
        onChange={onChange}
        type="text"
        placeholder={
          mode === 'cars'
            ? 'Search cars by make, model or color'
            : 'Find a seller or auctioneer by username'
        }
        className="input-custom min-w-0 flex-grow bg-transparent px-3 text-sm text-fg placeholder:text-muted/60"
      />
      <button
        onClick={search}
        aria-label="search"
        className="mx-1.5 rounded-full bg-redline p-2 text-paper transition-colors hover:bg-redline-deep active:translate-y-px"
      >
        <FaSearch size={14} />
      </button>
    </div>
  );
}
