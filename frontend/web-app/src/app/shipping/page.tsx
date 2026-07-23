import PageHero from '../components/PageHero';
import FallbackImage from '../components/FallbackImage';
import ShippingCalculator from './ShippingCalculator';

export const metadata = {
  title: 'Shipping · Yamkela Motors',
  description: 'How Yamkela Motors moves your vehicle from auction to your destination port.',
};

// Topical photography from LoremFlickr (open-license, locked seed for stability).
const services = [
  {
    name: 'Ground transportation',
    img: 'car,carrier,truck',
    lock: 7,
    body: 'Inland haulage from the auction yard to the departure port on enclosed or open carriers, tracked at every handover.',
  },
  {
    name: 'RoRo (Roll-on/Roll-off)',
    img: 'car,ferry,ship',
    lock: 18,
    body: 'The most economical ocean option. Drivable vehicles are rolled onto a dedicated car vessel and secured on deck.',
  },
  {
    name: 'Container',
    img: 'shipping,container,ship',
    lock: 24,
    body: 'Shared or sole-use containers for extra protection, non-running vehicles, or when you want parts shipped alongside.',
  },
  {
    name: 'Air freight',
    img: 'cargo,airplane',
    lock: 31,
    body: 'Fastest door-to-port option for high-value or time-critical vehicles. Priced by weight and volume.',
  },
];

const journey = [
  {
    step: 'Won at auction',
    body: 'Your winning lot is invoiced and collected from the seller once escrow is funded.',
  },
  {
    step: 'Ground transport',
    body: 'The vehicle is moved to the departure port and staged for loading.',
  },
  {
    step: 'Ocean or air',
    body: 'Loaded by your chosen method and tracked in transit with an estimated arrival window.',
  },
  {
    step: 'Receiving at destination',
    body: 'Cleared through the destination port; you collect it or we arrange final-mile delivery.',
  },
];

export default function ShippingPage() {
  return (
    <div>
      <PageHero
        eyebrow="Shipping"
        title="From the auction block to your port"
        subtitle="Yamkela handles inland transport, ocean and air freight, insurance and documentation, so your vehicle arrives safely wherever you are."
      />

      <section className="mb-12 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <span className="eyebrow">Overview</span>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            One team, door to port
          </h2>
          <p className="mt-3 max-w-xl leading-relaxed text-asphalt">
            Once you win a vehicle and fund escrow, our logistics desk books the whole
            journey for you. You get a single reference number, a binding quote after
            inspection, and status updates at each handover: yard, port, vessel and arrival.
            Duties and local charges at the destination are billed transparently and never
            marked up.
          </p>
        </div>
        <div>
          <span className="eyebrow">Estimate your freight</span>
          <div className="mt-2">
            <ShippingCalculator />
          </div>
        </div>
      </section>

      <section className="mb-12">
        <span className="eyebrow">Shipping services</span>
        <h2 className="mt-1 mb-5 font-display text-2xl font-bold tracking-tight text-ink">
          Choose how it travels
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {services.map((s) => (
            <article
              key={s.name}
              className="overflow-hidden rounded-xl border border-chrome/80 bg-paper-raised shadow-lot"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink">
                <FallbackImage
                  src={`https://loremflickr.com/800/450/${s.img}?lock=${s.lock}`}
                  alt={s.name}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold text-ink">{s.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-asphalt">{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-4">
        <span className="eyebrow">Transportation &amp; receiving</span>
        <h2 className="mt-1 mb-5 font-display text-2xl font-bold tracking-tight text-ink">
          Your car&apos;s journey
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((j, i) => (
            <li
              key={j.step}
              className="rounded-xl border border-chrome/80 bg-paper-raised p-5 shadow-lot"
            >
              <span className="readout text-3xl font-bold text-redline">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-display font-bold text-ink">{j.step}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-asphalt">{j.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
