'use client';

import { useParamsStore } from '@/hooks/useParamsStore';
import { useRouter, usePathname } from 'next/navigation';
import YamkelaMark from './YamkelaMark';

export default function Logo() {
  const router = useRouter();
  const pathname = usePathname();
  const reset = useParamsStore((state) => state.reset);

  function doReset() {
    if (pathname !== '/') router.push('/');
    reset();
  }

  return (
    <button onClick={doReset} className="group flex items-center gap-2 sm:gap-3" aria-label="Yamkela Motors — home">
      <YamkelaMark size={40} className="shrink-0 transition-transform duration-300 group-hover:-rotate-6 sm:h-[46px] sm:w-[46px]" />
      <div className="flex flex-col items-start leading-none">
        <span className="font-display text-lg font-extrabold uppercase tracking-[0.04em] text-fg sm:text-[22px] sm:tracking-[0.06em]">
          Yamkela<span className="ml-1 font-semibold text-muted sm:ml-1.5">Motors</span>
        </span>
        <span className="eyebrow mt-1 hidden sm:block">Your Bid. Your Drive. Your Way.</span>
      </div>
    </button>
  );
}
