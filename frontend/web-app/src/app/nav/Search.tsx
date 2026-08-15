'use client';

import { searchUsers, UserSuggestion } from '@/app/actions/verificationActions';
import { useParamsStore } from '@/hooks/useParamsStore';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { HiBadgeCheck } from 'react-icons/hi';

export default function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const setParams = useParamsStore((state) => state.setParams);
  const setSearchValue = useParamsStore((state) => state.setSearchValue);
  const searchValue = useParamsStore((state) => state.searchValue);

  const [mode, setMode] = useState<'cars' | 'sellers'>('cars');
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Debounced seller lookup while typing in Sellers mode.
  useEffect(() => {
    if (mode !== 'sellers') {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const q = searchValue.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setOpen(true);
    const t = setTimeout(async () => {
      const res = await searchUsers(q);
      if (cancelled) return;
      setSuggestions(res);
      setActive(-1);
      setLoading(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchValue, mode]);

  // Close the dropdown when clicking outside the search box.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function goToSeller(username: string) {
    setOpen(false);
    router.push(`/users/${encodeURIComponent(username)}`);
  }

  function search() {
    const q = searchValue.trim();
    if (mode === 'sellers') {
      if (active >= 0 && suggestions[active]) return goToSeller(suggestions[active].username);
      if (!q) return;
      return goToSeller(q.replace(/^@+/, ''));
    }
    if (pathname !== '/') router.push('/');
    setParams({ searchTerm: searchValue, vehicleType: '' });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (mode === 'sellers' && open && suggestions.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
    }
    if (e.key === 'Enter') search();
  }

  const showDropdown =
    mode === 'sellers' && open && searchValue.trim().length > 0;

  return (
    <div ref={boxRef} className="relative w-[60%]">
      <div className="flex h-11 items-center rounded-full border border-line/25 bg-surface shadow-lot transition-colors focus-within:border-redline">
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
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (mode === 'sellers' && searchValue.trim()) setOpen(true);
          }}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
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

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-lot-hover"
          >
            {loading && suggestions.length === 0 ? (
              <div className="px-4 py-5 text-center text-sm text-muted">Searching sellers…</div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-5 text-center text-sm text-muted">
                No sellers found for “{searchValue.trim()}”.
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1.5">
                {suggestions.map((u, i) => (
                  <li key={u.username}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => goToSeller(u.username)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        i === active ? 'bg-canvas' : 'hover:bg-canvas'
                      }`}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-ink font-display text-sm font-bold text-paper">
                        {u.profilePicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.profilePicture} alt="" className="h-full w-full object-cover" />
                        ) : (
                          u.username.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 font-display text-sm font-bold text-fg">
                          @{u.username}
                          {u.verified && (
                            <HiBadgeCheck className="h-4 w-4 shrink-0 text-sky-500" aria-label="Verified auctioneer" />
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted">{u.name}</span>
                      </span>
                      <span className="eyebrow shrink-0 !text-[10px] text-muted">View lots →</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
