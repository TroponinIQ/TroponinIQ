import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Lato } from 'next/font/google';
import { ThemeProvider } from '@/components/common/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { SystemMessageProvider } from '@/components/system/system-message-provider';
import { PWAProvider, OfflineIndicator, UpdateNotification } from '@/components/pwa/pwa-provider';

import './globals.css';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.troponiniq.com'),
  title: 'TroponinIQ - Expert Bodybuilding & Nutrition Coaching',
  description:
    'Get expert coaching advice from 20+ years of experience with world-class athletes. Training, nutrition, and supplement guidance powered by proven expertise.',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/maskable_icon_x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/maskable_icon_x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/maskable_icon_x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'TroponinIQ - Expert Bodybuilding & Nutrition Coaching',
    description: 'Get expert coaching advice from 20+ years of experience with world-class athletes.',
    images: ['/Troponin-Nutrition-OG-Cover.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TroponinIQ - Expert Bodybuilding & Nutrition Coaching',
    description: 'Get expert coaching advice from 20+ years of experience with world-class athletes.',
    images: ['/Troponin-Nutrition-OG-Cover.webp'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Disable auto-zoom on mobile Safari
  userScalable: false, // Prevent zoom
  viewportFit: 'cover', // Handle notch and safe areas
  interactiveWidget: 'resizes-content', // Handle iOS keyboard behavior
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(0 0% 100%)' },
    { media: '(prefers-color-scheme: dark)', color: 'hsl(240deg 10% 3.92%)' },
  ],
};

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  variable: '--font-lato',
});

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${lato.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PWAProvider>
            <TooltipProvider>
              <Toaster position="top-center" />
              <OfflineIndicator />
              <UpdateNotification />
              <ErrorBoundary>
                <SessionProvider>
                  <SystemMessageProvider />
                  {children}
                </SessionProvider>
              </ErrorBoundary>
            </TooltipProvider>
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
