import { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    // Check if already in standalone (PWA installed) mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // Check if user dismissed recently (7-day cooldown)
    const dismissedAt = localStorage.getItem('plates_pwa_dismissed_at');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show for iOS users after a brief delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // Handle beforeinstallprompt for Android / Chromium
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt banner after brief delay
      setTimeout(() => {
        setIsVisible(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSTip(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('[PWA] Installation prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('plates_pwa_dismissed_at', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 select-none">
      <div className="bg-[#18181B]/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/10 text-white rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.svg" 
            alt="Plates logo" 
            className="w-12 h-12 rounded-[22.5%] shrink-0 shadow-md border border-white/5"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Install Plates App
            </h4>
            <p className="text-xs text-zinc-400 truncate">
              Fast, full-screen access on your home screen.
            </p>
          </div>
          <button 
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {showIOSTip ? (
          <div className="bg-white/5 rounded-xl p-3 text-xs text-zinc-300 space-y-1.5 border border-white/5">
            <p className="font-semibold text-white flex items-center gap-1.5">
              Install on iOS:
            </p>
            <p className="flex items-center gap-2">
              1. Tap the <Share size={14} className="text-[#38bdf8] shrink-0" /> <span className="font-semibold text-white">Share</span> icon in Safari.
            </p>
            <p className="flex items-center gap-2">
              2. Scroll down & select <PlusSquare size={14} className="text-[#38bdf8] shrink-0" /> <span className="font-semibold text-white">Add to Home Screen</span>.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-white hover:bg-zinc-200 text-black font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md cursor-pointer"
            >
              <Download size={14} />
              <span>{isIOS ? 'How to Install' : 'Install App'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2.5 text-xs text-zinc-400 hover:text-white transition-colors rounded-xl cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
