import type { CSSProperties, ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Providers } from '@/app/providers';
import { brand } from '@/config/brand';
import '@/index.css';

export const metadata: Metadata = {
  icons: { icon: { url: '/favicon.svg', type: 'image/svg+xml' } },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const brandColors = {
  '--rf-accent': brand.accent,
  '--rf-accent-hover': brand.accentHover,
  '--rf-navy': brand.navy,
} as CSSProperties;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={brandColors}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <Script
          id="google-adsense"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5871594289590523"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "zbyj1kutx9");`}
        </Script>
      </body>
    </html>
  );
}
