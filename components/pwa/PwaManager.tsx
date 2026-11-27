"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, X, WifiOff, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [showInstallInfoModal, setShowInstallInfoModal] = useState(false);

  // 1. Register Service Worker & check standalone mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if running in standalone PWA mode
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

      setIsInstalled(isStandalone);

      // Register service worker
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
              console.log("PWA Service Worker registered with scope:", registration.scope);
            })
            .catch((err) => {
              console.warn("Service Worker registration failed:", err);
            });
        });
      }

      // Online / Offline listeners
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // 2. Listen to beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      // Check if user previously dismissed banner in this session
      const dismissed = sessionStorage.getItem("pwa_install_banner_dismissed");
      if (!dismissed) {
        // Show after a polite delay so user explores map first
        setTimeout(() => setShowInstallBanner(true), 3500);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallBanner(false);
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const handleCustomInstall = () => {
      if (deferredPrompt) {
        handleInstallClick();
      } else {
        setShowInstallInfoModal(true);
      }
    };
    window.addEventListener("delhi_pwa_install_request", handleCustomInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("delhi_pwa_install_request", handleCustomInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (err) {
      console.error("PWA install error:", err);
    }
  };

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("pwa_install_banner_dismissed", "true");
  };

  return (
    <>
      {/* Offline Alert Pill */}
      {isOffline && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode: Viewing cached map regions & places</span>
        </div>
      )}

      {/* Install Success Toast */}
      {installSuccess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>Delhi Explorer installed successfully! Access from home screen.</span>
        </div>
      )}

      {/* Floating Bottom PWA Install Banner (Mobile & Desktop) */}
      {!isInstalled && isInstallable && showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-96 z-40 bg-white/95 dark:bg-[#1a1c1e]/95 backdrop-blur-md rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.25)] border border-blue-500/30 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white shrink-0 p-1 shadow-xs">
                <Image
                  src="/brand/icon-192.png"
                  alt="Delhi Explorer App"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Install Delhi Explorer
                  </h3>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    PWA App
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  Fast offline map, full screen experience & zero app store download needed.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismissBanner}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
            <button
              onClick={handleDismissBanner}
              className="py-2 px-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
      {/* Install Helper Instructions Modal */}
      {showInstallInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1a1c1e] text-slate-800 dark:text-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Install PWA App</h3>
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Fast & Offline Ready</span>
                </div>
              </div>
              <button
                onClick={() => setShowInstallInfoModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-100">💻 On Desktop (Chrome / Edge / Brave):</p>
                <p>Click the <strong>Install icon (⊕ / computer icon)</strong> in the right corner of your browser address bar.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-100">📱 On Mobile (Android & iOS):</p>
                <p>Tap your browser menu (<strong>⋮</strong> or <strong>Share</strong> button) and select <strong>&quot;Add to Home Screen&quot;</strong> or <strong>&quot;Install App&quot;</strong>.</p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
