type Props = {
  size?: number;
  className?: string;
};

// Yamkela Motors marque: a dark instrument-dial badge. A tachometer tick sweep
// rings the rim; the "Y" monogram sits at the hub and its right arm extends
// outward as a needle sweeping into the redline zone.
export default function YamkelaMark({ size = 44, className }: Props) {
  const R_INNER = 36;
  const R_OUTER = 43;
  const COUNT = 21;
  const ticks = Array.from({ length: COUNT }, (_, i) => {
    const deg = -150 + (300 / (COUNT - 1)) * i; // 300° sweep, gap at bottom
    const a = (deg * Math.PI) / 180;
    const sin = Math.sin(a);
    const cos = Math.cos(a);
    const redline = deg >= 24 && deg <= 96; // upper-right = the redline
    return {
      x1: 50 + R_INNER * sin,
      y1: 50 - R_INNER * cos,
      x2: 50 + R_OUTER * sin,
      y2: 50 - R_OUTER * cos,
      redline,
    };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Yamkela Motors"
    >
      <circle cx="50" cy="50" r="48" fill="var(--ink)" />
      <circle cx="50" cy="50" r="46.5" fill="none" stroke="var(--chrome-dark)" strokeWidth="1" />
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={t.redline ? 'var(--redline)' : 'var(--chrome)'}
          strokeWidth={t.redline ? 2.4 : 1.4}
          strokeLinecap="round"
          opacity={t.redline ? 1 : 0.7}
        />
      ))}

      {/* Y monogram — stem + left arm in paper, right arm sweeps to a redline tip */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 55 L50 71" stroke="var(--paper)" strokeWidth="8" />
        <path d="M50 55 L36 37" stroke="var(--paper)" strokeWidth="8" />
        <path d="M50 55 L64 37" stroke="var(--paper)" strokeWidth="8" />
        <path d="M64 37 L72 27" stroke="var(--redline)" strokeWidth="6" />
      </g>
      <circle cx="72.5" cy="26.5" r="3.4" fill="var(--redline)" />
    </svg>
  );
}
