'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { InstallGuide } from '@/components/pwa/install-guide';
import { toast } from '@/hooks/use-toast';
import pwaConfig from '../../../pwa.config.json';

type InstallOutcome = 'accepted' | 'dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome }>;
};

type InstallGuide = 'ios-safari' | 'ios-other' | 'manual';

type PwaContextValue = {
  installed: boolean;
  promoOpen: boolean;
  guide: InstallGuide | null;
  install: () => Promise<void>;
  dismissPromo: () => void;
  closeGuide: () => void;
};

const PwaContext = createContext<PwaContextValue | null>(null);
const INSTALLED_KEY = 'rf-pwa-installed';
const DISMISS_KEY = 'rf-pwa-promo-dismissed-at';

export function PwaProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [guide, setGuide] = useState<InstallGuide | null>(null);
  const promptEvent = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone = isStandalone();
    const remembered = readStorage(INSTALLED_KEY) === '1';
    if (standalone || remembered) setInstalled(true);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      promptEvent.current = event as BeforeInstallPromptEvent;
      setInstalled(false);
      removeStorage(INSTALLED_KEY);
    };
    const onInstalled = () => {
      promptEvent.current = null;
      setInstalled(true);
      setPromoOpen(false);
      writeStorage(INSTALLED_KEY, '1');
      toast({
        title: 'ReelFetch is installed',
        description: 'Open it from your home screen or app launcher. This is the website, not a store app.',
      });
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!pwaConfig.promo.enabled || installed || isStandalone()) return;
    if (!window.matchMedia(pwaConfig.promo.mobileQuery).matches) return;
    if (promoDismissed()) return;
    const timer = window.setTimeout(() => setPromoOpen(true), pwaConfig.promo.showDelayMs);
    return () => window.clearTimeout(timer);
  }, [installed]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;
    const onControllerChange = () => {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    let registration: ServiceWorkerRegistration | null = null;
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then((next) => {
      registration = next;
    }).catch(() => {
      /* The page keeps working when registration is blocked. */
    });
    const update = () => {
      if (document.visibilityState === 'visible') void registration?.update();
    };
    document.addEventListener('visibilitychange', update);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  const install = useCallback(async () => {
    setPromoOpen(false);
    const prompt = promptEvent.current;
    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        promptEvent.current = null;
        if (choice.outcome === 'accepted') {
          toast({ title: 'Confirm the install prompt', description: 'ReelFetch will be added to this device from the browser.' });
        } else {
          toast({ title: 'Install dismissed', description: 'You can use Download App again when you want to install ReelFetch.' });
        }
      } catch {
        setGuide(installGuide());
      }
      return;
    }
    setGuide(installGuide());
  }, []);

  const dismissPromo = useCallback(() => {
    setPromoOpen(false);
    writeStorage(DISMISS_KEY, String(Date.now()));
  }, []);

  const closeGuide = useCallback(() => setGuide(null), []);

  const value = useMemo(
    () => ({ installed, promoOpen, guide, install, dismissPromo, closeGuide }),
    [installed, promoOpen, guide, install, dismissPromo, closeGuide],
  );

  return (
    <PwaContext.Provider value={value}>
      {children}
      <InstallGuide />
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const value = useContext(PwaContext);
  if (!value) throw new Error('usePwa must be used within PwaProvider');
  return value;
}

function installGuide(): InstallGuide {
  const userAgent = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return 'manual';
  const otherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);
  return otherIosBrowser ? 'ios-other' : 'ios-safari';
}

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

function promoDismissed() {
  const raw = readStorage(DISMISS_KEY);
  const dismissedAt = Number(raw);
  if (!Number.isFinite(dismissedAt)) return false;
  return Date.now() - dismissedAt < pwaConfig.promo.dismissForDays * 24 * 60 * 60 * 1000;
}

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private browsing can block storage. The prompt still works for this visit. */
  }
}

function removeStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* Ignore storage failures. */
  }
}
