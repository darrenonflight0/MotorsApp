type Props = {
  title: string;
  subtitle?: string;
  center?: boolean;
};

export default function Heading({ title, subtitle, center }: Props) {
  return (
    <div className={center ? 'text-center' : 'text-start'}>
      <div className="font-display text-2xl font-bold tracking-tight text-ink">{title}</div>
      {subtitle && <div className="mt-1.5 text-sm text-asphalt">{subtitle}</div>}
    </div>
  );
}
