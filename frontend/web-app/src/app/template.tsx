'use client';

import { motion, useReducedMotion } from 'motion/react';

// A Next.js template re-mounts on every navigation, so this gives each route a
// gentle enter transition without a heavy page-transition library.
export default function Template({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
