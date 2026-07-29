'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { HiMoon, HiSun } from 'react-icons/hi';

/**
 * Light/dark theme toggle. The initial class is set pre-paint by an inline
 * script in the document head (no flash); this only reflects and flips it.
 */
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('yamkela-theme', next ? 'dark' : 'light');
    } catch {
      /* storage unavailable — theme lasts this session only */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-lg p-2 text-fg transition-colors hover:text-redline"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="block"
        >
          {dark ? <HiMoon className="h-5 w-5" /> : <HiSun className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
