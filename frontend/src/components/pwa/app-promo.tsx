'use client';

import { X } from 'lucide-react';
import { InstallAppButton } from '@/components/pwa/install-app-button';
import { usePwa } from '@/components/pwa/pwa-provider';

export function AppPromo() {
  const { installed, promoOpen, dismissPromo } = usePwa();
  if (!promoOpen || installed) return null;

  return (
    <aside className="rf-app-promo" aria-label="Install ReelFetch">
      <img src="/icons/icon-192.png" width="48" height="48" alt="" />
      <div className="rf-app-promo-copy">
        <h2>Install ReelFetch</h2>
        <p>Add the site to your home screen and open it like an app. It is not an App Store or APK download.</p>
      </div>
      <InstallAppButton variant="promo" />
      <button type="button" className="rf-app-promo-close" onClick={dismissPromo} aria-label="Dismiss app promotion">
        <X size={18} aria-hidden="true" />
      </button>
    </aside>
  );
}
