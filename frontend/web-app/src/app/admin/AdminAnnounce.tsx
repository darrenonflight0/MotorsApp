'use client';

import { sendAnnouncement } from '@/app/actions/announcementActions';
import { useState } from 'react';
import { HiSpeakerphone } from 'react-icons/hi';
import toast from 'react-hot-toast';

// Admin composer: broadcast an announcement (new lots, notices, anything
// important) to every connected user in real time.
export default function AdminAnnounce() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [href, setHref] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!message.trim()) {
      toast.error('Enter a message to broadcast.');
      return;
    }
    setBusy(true);
    try {
      const res = await sendAnnouncement({ title: title.trim(), message: message.trim(), href: href.trim() });
      if ('error' in res) throw new Error(res.error.message);
      toast.success('Announcement sent to all users');
      setTitle('');
      setMessage('');
      setHref('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send the announcement');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <span className="eyebrow">Broadcast</span>
      <h2 className="mb-4 mt-1 flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-fg">
        <HiSpeakerphone className="text-redline" /> Send an announcement
      </h2>
      <div className="grid gap-3 rounded-xl border border-line/70 bg-surface p-4 shadow-lot">
        <p className="text-sm text-muted">
          Reaches every user currently on the site instantly (toast + notification bell), with the
          signature engine-rev alert. Use it for new lots, maintenance windows, or important notices.
        </p>
        <label className="grid gap-1 text-sm">
          <span className="eyebrow">Title (optional)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New lot just dropped"
            maxLength={80}
            className="rounded-lg border border-line/70 bg-canvas px-3 py-2 text-fg"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="eyebrow">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What do you want everyone to know?"
            rows={3}
            maxLength={280}
            className="rounded-lg border border-line/70 bg-canvas px-3 py-2 text-fg"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="eyebrow">Link (optional)</span>
          <input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="/auctions/details/… or /shipping"
            className="rounded-lg border border-line/70 bg-canvas px-3 py-2 text-fg"
          />
        </label>
        <div>
          <button disabled={busy} onClick={send} className="btn-primary disabled:opacity-50">
            {busy ? 'Sending…' : 'Broadcast to all users'}
          </button>
        </div>
      </div>
    </section>
  );
}
