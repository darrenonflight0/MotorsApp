type Props = {
  label?: string;
  fullscreen?: boolean;
};

// Revving tachometer loader — the rim spins, the needle sweeps into the redline.
function SpinnerDial({ size = 76 }: { size?: number }) {
  const R_INNER = 36;
  const R_OUTER = 43;
  const COUNT = 24;
  const ticks = Array.from({ length: COUNT }, (_, i) => {
    const deg = (360 / COUNT) * i;
    const a = (deg * Math.PI) / 180;
    const redline = deg >= 300 || deg <= 30;
    return {
      x1: 50 + R_INNER * Math.sin(a),
      y1: 50 - R_INNER * Math.cos(a),
      x2: 50 + R_OUTER * Math.sin(a),
      y2: 50 - R_OUTER * Math.cos(a),
      redline,
    };
  });

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Loading">
      <circle cx="50" cy="50" r="48" fill="var(--ink)" />
      <g className="loader-rim">
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.redline ? 'var(--redline)' : 'var(--chrome)'}
            strokeWidth={t.redline ? 2.6 : 1.4}
            strokeLinecap="round"
            opacity={t.redline ? 1 : 0.55}
          />
        ))}
      </g>
      {/* Y hub */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 55 L50 70" stroke="var(--paper)" strokeWidth="7" />
        <path d="M50 55 L37 38" stroke="var(--paper)" strokeWidth="7" />
        <g className="loader-needle">
          <path d="M50 55 L63 38" stroke="var(--paper)" strokeWidth="7" />
          <path d="M63 38 L71 28" stroke="var(--redline)" strokeWidth="5" />
        </g>
      </g>
      <circle cx="50" cy="55" r="3" fill="var(--redline)" />
    </svg>
  );
}

export default function Loader({ label = 'Warming up the grid', fullscreen }: Props) {
  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-canvas'
          : 'flex flex-col items-center justify-center gap-5 py-24'
      }
      role="status"
      aria-live="polite"
    >
      <SpinnerDial />
      <div className="text-center">
        <div className="font-display text-lg font-extrabold uppercase tracking-[0.08em] text-fg">
          Yamkela<span className="ml-1.5 font-semibold text-muted">Motors</span>
        </div>
        <div className="loader-breathe eyebrow mt-1.5">{label}</div>
      </div>
    </div>
  );
}
