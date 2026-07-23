import { getCurrentUser } from './actions/authActions';
import Hero from './components/Hero';
import ReturnGreeting from './components/ReturnGreeting';
import ActivityTicker from './components/ActivityTicker';
import BrowseByBrand from './components/BrowseByBrand';
import BrowseByType from './components/BrowseByType';
import Listings from './auctions/Listings';

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <>
      <ReturnGreeting name={user?.name} />
      <Hero />
      <ActivityTicker />
      <BrowseByBrand />
      <BrowseByType />
      <div id="lots" className="scroll-mt-24">
        <Listings />
      </div>
    </>
  );
}
