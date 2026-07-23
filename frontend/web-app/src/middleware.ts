export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/auctions/create', '/auctions/update/:path*', '/session'],
};
