'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import Script from 'next/script';

export type ConsentChoice = 'accepted' | 'rejected' | null;

type CookieConsentContextValue = {
  choice: ConsentChoice;
  bannerOpen: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  openSettings: () => void;
};

const STORAGE_KEY = 'rf-cookie-consent';
const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'accepted' || saved === 'rejected') {
        setChoice(saved);
        setBannerOpen(false);
      } else {
        setBannerOpen(true);
      }
    } catch {
      setBannerOpen(true);
    }
  }, []);

  const persist = useCallback((next: 'accepted' | 'rejected') => {
    setChoice(next);
    setBannerOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Storage unavailable */
    }
  }, []);

  const acceptAll = useCallback(() => persist('accepted'), [persist]);
  const rejectNonEssential = useCallback(() => persist('rejected'), [persist]);
  const openSettings = useCallback(() => setBannerOpen(true), []);

  return (
    <CookieConsentContext.Provider value={{ choice, bannerOpen, acceptAll, rejectNonEssential, openSettings }}>
      {children}
      {choice === 'accepted' && (
        <>
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-V30LSQ672C" strategy="afterInteractive" />
          <Script id="google-analytics-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-V30LSQ672C');`}
          </Script>
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "zbyj1kutx9");`}
          </Script>
        </>
      )}
      {bannerOpen && (
        <aside className="rf-cookie-banner" role="dialog" aria-label="Cookie preferences" data-testid="cookie-consent-banner">
          <div className="rf-cookie-content">
            <div>
              <strong>Cookie &amp; Privacy Preferences</strong>
              <p>
                ReelFetch uses essential browser storage for site preferences and, with your consent, loads analytics (Google Analytics &amp; Microsoft Clarity) to improve reliability. Advertising scripts are governed by our{' '}
                <a href="/privacy">Privacy Policy</a>.
              </p>
            </div>
            <div className="rf-cookie-actions">
              <button type="button" className="rf-button rf-button-secondary" onClick={rejectNonEssential} data-testid="button-cookie-reject">
                Reject Non-Essential
              </button>
              <button type="button" className="rf-button rf-button-primary" onClick={acceptAll} data-testid="button-cookie-accept">
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return ctx;
}
