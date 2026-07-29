'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

/** Photo gallery for a listing: a main image plus a thumbnail strip. */
export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const photos = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line/80 bg-ink shadow-lot">
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            src={current}
            alt={alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
      </div>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === active ? 'border-redline' : 'border-line/60 opacity-70 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
