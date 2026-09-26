import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export type InstallOutcome =
  | { status: 'installed_native'; outcome: 'accepted' }
  | { status: 'dismissed_native'; outcome: 'dismissed' }
  | { status: 'already_installed' }
  | { status: 'manual_guide_needed'; platform: 'android' | 'ios' | 'desktop' };

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    typeof window !== 'undefined' ? window.__pwaDeferredPrompt || null : null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone display mode (already installed on home screen)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Platform detection
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    const androidDevice = /android/.test(ua);
    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.__pwaDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    const handlePwaReady = () => {
      if (window.__pwaDeferredPrompt) {
        setDeferredPrompt(window.__pwaDeferredPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-ready', handlePwaReady);

    if (window.__pwaDeferredPrompt && !deferredPrompt) {
      setDeferredPrompt(window.__pwaDeferredPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-ready', handlePwaReady);
    };
  }, [deferredPrompt]);

  const triggerInstall = useCallback(async (): Promise<InstallOutcome> => {
    // Check if already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone || isInstalled) {
      return { status: 'already_installed' };
    }

    let promptEvent = deferredPrompt || window.__pwaDeferredPrompt;

    // If prompt is not immediately ready, wait briefly for Chrome to fire the event
    if (!promptEvent && typeof window !== 'undefined') {
      promptEvent = await new Promise<BeforeInstallPromptEvent | null>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 900);
        const onReady = () => {
          if (window.__pwaDeferredPrompt) {
            clearTimeout(timeout);
            window.removeEventListener('pwa-ready', onReady);
            resolve(window.__pwaDeferredPrompt);
          }
        };
        const onPrompt = (e: Event) => {
          clearTimeout(timeout);
          window.removeEventListener('beforeinstallprompt', onPrompt);
          resolve(e as BeforeInstallPromptEvent);
        };
        window.addEventListener('pwa-ready', onReady, { once: true });
        window.addEventListener('beforeinstallprompt', onPrompt, { once: true });
      });
    }

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          window.__pwaDeferredPrompt = null;
          setDeferredPrompt(null);
          return { status: 'installed_native', outcome: 'accepted' };
        }
        return { status: 'dismissed_native', outcome: 'dismissed' };
      } catch (err) {
        console.warn('Chrome native prompt error:', err);
      }
    }

    // Fallback if browser did not provide native prompt
    const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
    return { status: 'manual_guide_needed', platform };
  }, [deferredPrompt, isInstalled, isIOS, isAndroid]);

  return {
    isInstallable: !!(deferredPrompt || window.__pwaDeferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    triggerInstall,
  };
}
