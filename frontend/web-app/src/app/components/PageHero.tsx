type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export default function PageHero({ eyebrow, title, subtitle }: Props) {
  return (
    <section className="mb-10 overflow-hidden rounded-2xl bg-ink px-6 py-10 text-paper sm:px-10">
      <span className="eyebrow !text-chrome">{eyebrow}</span>
      <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
        {title}
      </h1>
      {subtitle && <p className="mt-4 max-w-2xl text-base leading-relaxed text-chrome">{subtitle}</p>}
    </section>
  );
}
