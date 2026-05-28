import type {Metadata} from 'next';
import {Inter, Montserrat} from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BarberPro | Premium Management & Landing Page',
  description: 'Premium administrative management dashboard and client landing page for modern barbershop businesses.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${montserrat.variable} dark`}>
      <body suppressHydrationWarning className="bg-background text-on-surface font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
