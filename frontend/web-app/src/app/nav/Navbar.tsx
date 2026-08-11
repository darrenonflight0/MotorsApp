import { getCurrentUser } from '@/app/actions/authActions';
import Link from 'next/link';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import Logo from './Logo';
import Search from './Search';
import LoginButton from './LoginButton';
import UserActions from './UserActions';
import NotificationBell from './NotificationBell';
import WatchlistBell from './WatchlistBell';
import NavLinks from './NavLinks';
import MobileNav from './MobileNav';
import ThemeToggle from './ThemeToggle';

export default async function Navbar() {
  const user = await getCurrentUser();
  const isAdmin = !!user && (Array.isArray(user.role) ? user.role.includes('Admin') : user.role === 'Admin');

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/85 backdrop-blur-md">
      {/* redline hairline — the brand signature at the very top edge */}
      <div className="h-[3px] w-full bg-gradient-to-r from-redline via-redline-deep to-redline" />
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 py-3 sm:px-8">
        <Logo />
        <div className="hidden flex-1 justify-center md:flex">
          <Search />
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-3 md:ml-0">
          {/* On phones every control collapses into the single menu button; icons return at sm+ */}
          <div className="hidden items-center gap-3 sm:flex">
            <ThemeToggle />
            <WatchlistBell />
            <NotificationBell />
          </div>
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-1 rounded-lg border border-redline/40 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wide text-redline transition-colors hover:bg-redline hover:text-paper sm:inline-flex"
            >
              <HiOutlineShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          {user ? (
            <span className="hidden sm:block">
              <UserActions user={user} />
            </span>
          ) : (
            <span className="hidden sm:block">
              <LoginButton />
            </span>
          )}
          <MobileNav user={user} />
        </div>
      </div>
      <div className="mx-auto hidden max-w-[1400px] items-center border-t border-line/50 px-5 sm:px-8 lg:flex">
        <NavLinks />
      </div>
    </header>
  );
}
