'use client';

import Heading from '@/app/components/Heading';
import {
  getMyPayout,
  getPayoutBanks,
  registerPayout,
  type PayoutBank,
  type PayoutMethod,
} from '@/app/actions/payoutActions';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const CURRENCY = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY ?? 'GHS';

export default function PayoutSettings() {
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<string>('');
  const [method, setMethod] = useState<PayoutMethod | null>(null);
  const [editing, setEditing] = useState(false);

  const [banks, setBanks] = useState<PayoutBank[]>([]);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyPayout().then((res) => {
      if (!('error' in res)) {
        setProvider(res.provider);
        setMethod(res.method);
        setEditing(!res.method);
      }
      setLoading(false);
    });
  }, []);

  // Load the bank list lazily, the first time the form is shown.
  useEffect(() => {
    if (!editing || banks.length > 0) return;
    getPayoutBanks(CURRENCY).then((res) => {
      if (Array.isArray(res)) setBanks(res);
    });
  }, [editing, banks.length]);

  async function save() {
    if (!bankCode || !accountNumber.trim() || !accountName.trim()) {
      toast.error('Choose your bank and enter your account number and name.');
      return;
    }
    setSaving(true);
    try {
      const res = await registerPayout({
        bankCode,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        currency: CURRENCY,
      });
      if ('error' in res) throw new Error(res.error.message);
      setMethod(res);
      setEditing(false);
      setAccountNumber('');
      toast.success('Payout account saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save payout account');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <section className="mb-10 rounded-xl border border-line/80 bg-surface shadow-lot">
      <div className="flex items-center justify-between border-b border-line/70 p-4">
        <Heading title="Payout settings" />
        {provider && (
          <span className="eyebrow rounded-full bg-line/50 px-2.5 py-1 text-muted">via {provider}</span>
        )}
      </div>

      <div className="p-4">
        <p className="text-sm text-muted">
          Where we send your proceeds when a lot you sell clears escrow. We store only your
          bank and the last 4 digits — never your full account number.
        </p>

        {method && !editing ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line/70 bg-canvas p-3">
            <div className="text-sm">
              <div className="font-display font-semibold text-fg">{method.bankName ?? 'Bank account'}</div>
              <div className="text-muted">
                {method.accountName ? `${method.accountName} · ` : ''}•••• {method.accountLast4}
                {method.currency ? ` · ${method.currency}` : ''}
              </div>
            </div>
            <button onClick={() => setEditing(true)} className="btn-ghost text-sm">
              Change
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="eyebrow">Bank</span>
              {banks.length > 0 ? (
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="rounded-lg border border-line/70 bg-canvas px-3 py-2 text-fg"
                >
                  <option value="">Select your bank…</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  placeholder="Bank code"
                  className="rounded-lg border border-line/70 bg-canvas px-3 py-2 text-fg"
                />
              )}
            </label>

            <label className="grid gap-1 text-sm">
              <span className="eyebrow">Account number</span>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                inputMode="numeric"
                placeholder="Account number"
                className="rounded-lg border border-line/70 bg-canvas px-3 py-2 text-fg"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="eyebrow">Account holder name</span>
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Name as it appears at your bank"
                className="rounded-lg border border-line/70 bg-canvas px-3 py-2 text-fg"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button disabled={saving} onClick={save} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving…' : 'Save payout account'}
              </button>
              {method && (
                <button onClick={() => setEditing(false)} className="btn-ghost text-sm">
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
