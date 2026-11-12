'use client';

import { Download } from 'lucide-react';
import { usePwa } from '@/components/pwa/pwa-provider';

export function InstallAppButton({ variant = 'nav' }: { variant?: 'nav' | 'compact' | 'promo' }) {
  const { installed, install } = usePwa();

  if (installed) {
    if (variant === 'compact' || variant === 'promo') return null;
    return <span className="rf-install-status">Installed</span>;
  }

  const className = variant === 'compact' ? 'rf-install-compact' : variant === 'promo' ? 'rf-button rf-button-primary' : 'rf-nav-install';
  const label = variant === 'promo' ? 'Install App' : 'Download App';

  return (
    <button type="button" className={className} onClick={() => void install()} data-testid={variant === 'compact' ? 'button-install-compact' : variant === 'promo' ? 'button-install-promo' : 'button-install-app'}>
      <Download size={16} aria-hidden="true" />
      {variant === 'compact' ? <span className="rf-sr-only">{label}</span> : label}
    </button>
  );
}
