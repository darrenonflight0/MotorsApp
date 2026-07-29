'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import { usePathname, useRouter } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';

export default function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const setParams = useParamsStore((state) => state.setParams);
  const setSearchValue = useParamsStore((state) => state.setSearchValue);
  const searchValue = useParamsStore((state) => state.searchValue);

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(event.target.value);
  }

  function search() {
    if (pathname !== '/') router.push('/');
    setParams({ searchTerm: searchValue });
  }

  return (
    <div className="flex h-11 w-[60%] items-center rounded-full border border-line/25 bg-surface shadow-lot transition-colors focus-within:border-redline">
      <input
        onKeyDown={(e) => {
          if (e.key === 'Enter') search();
        }}
        value={searchValue}
        onChange={onChange}
        type="text"
        placeholder="Search for cars by make, model or color"
        className="input-custom flex-grow bg-transparent px-4 text-sm text-fg placeholder:text-muted/60"
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
