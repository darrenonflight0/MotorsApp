import PageHero from '../components/PageHero';
import WatchlistView from './WatchlistView';

export const metadata = {
  title: 'Your watchlist · Yamkela Motors',
  description: 'The lots you saved, with live countdowns.',
};

export default function WatchlistPage() {
  return (
    <div>
      <PageHero
        eyebrow="Saved lots"
        title="Your watchlist"
        subtitle="Everything you've saved, with the clock still running. Jump back in before they close."
      />
      <WatchlistView />
    </div>
  );
}
