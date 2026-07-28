'use client';

import { fileToDataUri } from '@/lib/captureImage';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePhotograph, HiX } from 'react-icons/hi';

type Props = {
  value: string[];
  onChange: (images: string[]) => void;
  max?: number;
};

/**
 * Upload / paste / drag-drop image picker for car photos. Produces compressed
 * data URIs — there is no image-URL field. The first image is the cover.
 */
export default function ImageUploader({ value, onChange, max = 6 }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const room = max - value.length;
      if (room <= 0) {
        toast.error(`Up to ${max} photos.`);
        return;
      }
      const chosen = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, room);
      try {
        const uris = await Promise.all(chosen.map(fileToDataUri));
        onChange([...value, ...uris]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not read an image');
      }
    },
    [value, onChange, max]
  );

  function onPaste(e: React.ClipboardEvent) {
    const imgs = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'));
    if (imgs.length) {
      e.preventDefault();
      addFiles(imgs);
    }
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div onPaste={onPaste}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragging ? 'border-redline bg-redline/5' : 'border-chrome/80 bg-paper hover:border-chrome-dark/50'
        }`}
      >
        <HiOutlinePhotograph className="h-8 w-8 text-chrome-dark" />
        <p className="mt-2 text-sm font-medium text-ink">Tap to add photos</p>
        <p className="text-xs text-asphalt">or drag, drop, or paste — up to {max}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          <AnimatePresence>
            {value.map((src, i) => (
              <motion.div
                key={src.slice(0, 40) + i}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative aspect-square overflow-hidden rounded-lg border border-chrome/70 bg-ink"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`photo ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-paper">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(i); }}
                  className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-paper opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <HiX className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
