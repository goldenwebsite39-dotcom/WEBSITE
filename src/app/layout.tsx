import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { CartProvider } from '@/lib/context/CartProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Gaming PC Store - Premium Gaming Computers',
  description: 'Build your dream gaming PC with our premium components. Expertly curated hardware, competitive pricing, and exceptional service.',
  keywords: 'gaming PC, custom PC build, graphics cards, gaming components, RTX, Ryzen, Intel, gaming hardware',
  openGraph: {
    title: 'Gaming PC Store - Premium Gaming Computers',
    description: 'Build your dream gaming PC with our premium components. Expertly curated hardware, competitive pricing.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Gaming PC Store',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gaming PC Store - Premium Gaming Computers',
    description: 'Build your dream gaming PC with our premium components.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster position="bottom-right" />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
