'use client';

import { getEscrowMessages, sendEscrowMessage } from '@/app/actions/escrowActions';
import { EscrowMessage } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  auctionId: string;
  username: string;
  counterparty: string;
  open: boolean; // sending allowed (sale in progress)
};

export default function EscrowMessages({ auctionId, username, counterparty, open }: Props) {
  const [messages, setMessages] = useState<EscrowMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    getEscrowMessages(auctionId).then((res) => {
      if (Array.isArray(res)) setMessages(res);
    });
  }, [auctionId]);

  useEffect(load, [load]);

  // Refresh live when the other party writes (SignalRProvider re-dispatches the alert).
  useEffect(() => {
    const onActivity = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.auctionId === auctionId && d?.kind === 'Message') load();
    };
    window.addEventListener('escrow-activity', onActivity);
    return () => window.removeEventListener('escrow-activity', onActivity);
  }, [auctionId, load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await sendEscrowMessage(auctionId, text.trim());
      if (!Array.isArray(res)) throw new Error(res.error.message);
      setMessages(res);
      setText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send message');
    } finally {
      setSending(false);
    }
  }

  if (!open && messages.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-line/70 bg-canvas p-3">
      <span className="eyebrow">Messages with {counterparty}</span>

      <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-sm text-muted">No messages yet. Ask about pickup, documents or timing here.</p>
        )}
        {messages.map((m, i) => {
          const mine = m.from === username;
          return (
            <div key={`${m.at}-${i}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  mine ? 'bg-racing/10 text-fg' : 'bg-surface text-fg shadow-lot'
                }`}
              >
                {!mine && <div className="text-[11px] font-semibold text-muted">{m.from}</div>}
                <div className="whitespace-pre-wrap break-words">{m.text}</div>
                <div className="mt-0.5 text-[10px] text-muted">
                  {new Date(m.at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {open && (
        <div className="mt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            maxLength={1000}
            placeholder={`Message ${counterparty}…`}
            className="min-w-0 flex-1 rounded-lg border border-line/70 bg-surface px-3 py-2 text-sm text-fg"
          />
          <button disabled={sending || !text.trim()} onClick={send} className="btn-primary disabled:opacity-50">
            Send
          </button>
        </div>
      )}
    </div>
  );
}
