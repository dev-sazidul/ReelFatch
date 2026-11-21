'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { usePwa } from '@/components/pwa/pwa-provider';

const copy = {
  'ios-safari': {
    title: 'Add ReelFetch to your Home Screen',
    intro: 'iPhone and iPad install ReelFetch from Safari. This is the website added to your Home Screen, not an App Store app.',
    steps: ['Tap the Share button in Safari.', 'Scroll down and tap Add to Home Screen.', 'Tap Add. ReelFetch then opens from that icon.'],
  },
  'ios-other': {
    title: 'Open Safari to install ReelFetch',
    intro: 'This iPhone or iPad browser cannot add ReelFetch to the Home Screen. There is no separate App Store app.',
    steps: ['Copy the page address.', 'Open it in Safari.', 'Tap Share, then Add to Home Screen, then Add.'],
  },
  manual: {
    title: 'Install ReelFetch from your browser',
    intro: 'This browser does not offer an automatic install prompt. ReelFetch does not publish an APK or App Store app.',
    steps: ['Look for an install icon in the address bar.', 'Or open the browser menu and choose Install ReelFetch or Add to Home screen.', 'If ReelFetch is already installed, open that icon instead of installing again.'],
  },
} as const;

export function InstallGuide() {
  const { guide, closeGuide } = usePwa();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (guide && !dialog.open) dialog.showModal();
    if (!guide && dialog.open) dialog.close();
  }, [guide]);

  const content = guide ? copy[guide] : copy.manual;

  return (
    <dialog ref={dialogRef} className="rf-install-dialog" aria-labelledby="install-guide-title" onClose={closeGuide}>
      <button type="button" className="rf-install-dialog-close" onClick={closeGuide} aria-label="Close install instructions">
        <X size={18} aria-hidden="true" />
      </button>
      <h2 id="install-guide-title">{content.title}</h2>
      <p>{content.intro}</p>
      <ol>
        {content.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
    </dialog>
  );
}
