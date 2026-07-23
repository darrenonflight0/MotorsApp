import { getData } from '@/app/actions/auctionActions';

async function safeCount(query: string): Promise<number> {
  try {
    const res = await getData(query);
    return res?.totalCount ?? 0;
  } catch {
    return 0;
  }
}

export default async function Hero() {
  const [liveCount, endingSoon] = await Promise.all([
    safeCount('?pageSize=1'),
    safeCount('?filterBy=endingSoon&pageSize=1'),
  ]);

  return (
    <section className="relative mb-10 overflow-hidden rounded-2xl bg-ink text-paper">
      {/* layered ambient depth: warm core glow + redline accent haze */}
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(90% 120% at 15% 0%, #262d38 0%, transparent 55%), radial-gradient(60% 90% at 100% 100%, rgba(228,0,43,0.18) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      {/* faint instrument grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(var(--chrome) 1px, transparent 1px), linear-gradient(90deg, var(--chrome) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
        aria-hidden="true"
      />
      {/* ambient tachometer arc */}
      <svg
        className="pointer-events-none absolute -right-16 -top-24 h-[140%] w-auto opacity-[0.14]"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        {Array.from({ length: 40 }).map((_, i) => {
          const deg = -120 + (240 / 39) * i;
          const a = (deg * Math.PI) / 180;
          const redzone = deg >= 40;
          return (
            <line
              key={i}
              x1={100 + 78 * Math.sin(a)}
              y1={100 - 78 * Math.cos(a)}
              x2={100 + 92 * Math.sin(a)}
              y2={100 - 92 * Math.cos(a)}
              stroke={redzone ? '#e4002b' : '#d7dae0'}
              strokeWidth={redzone ? 3 : 1.5}
            />
          );
        })}
      </svg>

      <div className="relative grid gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[1.4fr_1fr] lg:py-16">
        <div>
          <span className="eyebrow rise-in block !text-chrome">Live car auctions · Real-time bidding</span>
          <h1 className="rise-in rise-in-1 mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Your bid. Your drive.{' '}
            <span className="text-redline">Your way.</span>
          </h1>
          <p className="rise-in rise-in-2 mt-5 max-w-lg font-body text-base leading-relaxed text-chrome">
            Every lot is live and settled in real time. Watch the clock, place your paddle, and drive
            away the car you came for. No dealer, no games.
          </p>
          <div className="rise-in rise-in-3 mt-8 flex flex-wrap gap-3">
            <a
              href="#lots"
              className="inline-flex items-center rounded-lg bg-redline px-5 py-3 font-display text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:bg-redline-deep"
            >
              Browse live lots
            </a>
            <a
              href="/auctions/create"
              className="inline-flex items-center rounded-lg border border-chrome-dark px-5 py-3 font-display text-sm font-bold uppercase tracking-wide text-paper transition-colors hover:border-chrome hover:bg-white/5"
            >
              Sell your car
            </a>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-5 lg:border-l lg:border-chrome-dark/60 lg:pl-10">
          <Stat value={liveCount} label="Lots live now" tone="live" />
          <Stat value={endingSoon} label="Ending within 6 hours" tone="soon" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: 'live' | 'soon' }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-2.5 w-2.5 rounded-full ${tone === 'live' ? 'bg-racing' : 'bg-redline'}`} />
      <div>
        <div className="readout text-4xl font-bold leading-none text-paper">
          {String(value).padStart(2, '0')}
        </div>
        <div className="eyebrow mt-1.5 !text-chrome">{label}</div>
      </div>
    </div>
  );
}
