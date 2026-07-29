import type { Metadata } from 'next';
import { Archivo, Public_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import Navbar from './nav/Navbar';
import Footer from './components/Footer';
import Providers from './providers/Providers';
import SplashScreen from './components/SplashScreen';
import CookieConsent from './components/CookieConsent';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800', '900'],
  display: 'swap',
});

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Yamkela Motors — Live Car Auctions',
  description: 'Your Bid. Your Drive. Your Way.',
};

// Set the theme class before first paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('yamkela-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${archivo.variable} ${publicSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <SplashScreen />
          <Navbar />
          <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-8 sm:px-8">{children}</main>
          <Footer />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
