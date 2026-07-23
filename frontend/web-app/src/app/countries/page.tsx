import PageHero from '../components/PageHero';
import CountryPicker from './CountryPicker';

export const metadata = {
  title: 'Shop by country · Yamkela Motors',
  description: 'Choose the market you want to buy from: Ghana, China, Japan, USA, Canada or South Africa.',
};

export default function CountriesPage() {
  return (
    <div>
      <PageHero
        eyebrow="Shop by country"
        title="Where do you want to buy from?"
        subtitle="Source your next vehicle from one of our six export markets. Pick a country to see exactly what's available to ship from there."
      />
      <CountryPicker />
    </div>
  );
}
