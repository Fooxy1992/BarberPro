import type {Metadata} from 'next';
import {Outfit} from 'next/font/google';
import './globals.css'; // Global styles

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Barberly | Premium Barbershop Management',
  description: 'Premium administrative management dashboard and client landing page for modern barbershop businesses.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} dark`}>
      <body suppressHydrationWarning className="bg-background text-on-surface font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
