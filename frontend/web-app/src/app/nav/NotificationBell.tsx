'use client';

import { useNotificationStore } from '@/hooks/useNotificationStore';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HiBell } from 'react-icons/hi';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clear = useNotificationStore((s) => s.clear);

  const unread = notifications.filter((n) => !n.read).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) markAllRead();
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative p-1 text-ink transition-colors hover:text-redline"
        aria-label="notifications"
      >
        <HiBell size={22} />
        {unread > 0 && (
          <span className="readout absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-redline px-1 text-[10px] font-bold text-paper">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-3 max-h-96 w-80 overflow-y-auto rounded-xl border border-chrome/80 bg-paper-raised shadow-lot-hover"
          >
            <div className="flex items-center justify-between border-b border-chrome/70 px-4 py-3">
              <span className="eyebrow !text-ink">Notifications</span>
              {notifications.length > 0 && (
                <button
                  onClick={clear}
                  className="text-xs font-medium text-redline transition-colors hover:text-redline-deep"
                >
                  Clear
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-asphalt">
                Nothing yet. New bids and lots will land here.
              </div>
            ) : (
              notifications.map((n) => {
                const inner = (
                  <div className="border-b border-chrome/60 px-4 py-3 text-sm transition-colors last:border-0 hover:bg-paper">
                    <div className="font-display font-semibold text-ink">{n.type}</div>
                    <div className="mt-0.5 text-asphalt">{n.message}</div>
                  </div>
                );
                return n.href ? (
                  <button
                    key={n.id}
                    onClick={() => {
                      router.push(n.href!);
                      setOpen(false);
                    }}
                    className="block w-full text-left"
                  >
                    {inner}
                  </button>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
