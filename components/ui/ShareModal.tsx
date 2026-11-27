"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MapPin,
  Compass,
  Sparkles,
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl: string;
  description?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  shareUrl,
  description,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } else {
      prompt("Copy share link:", shareUrl);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `📍 *${title}* – Delhi Explorer\n${
      description ? `${description}\n` : ""
    }\n🗺️ Open Live Map View:\n${shareUrl}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleNativeShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `${title} – Delhi Explorer`,
          text: `Explore ${title} on Delhi Explorer map!`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dynamic blurred backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Glassmorphic Modal Dialog */}
      <div className="relative w-full max-w-md bg-white/95 dark:bg-[#18191c]/95 backdrop-blur-xl rounded-[28px] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-white/10 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100 select-none overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-indigo-500/0 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-emerald-500/15 to-teal-500/0 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between relative z-10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 ring-4 ring-blue-50 dark:ring-blue-950/40">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Share Map View
                </h3>
                <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/50">
                  <Sparkles className="w-2.5 h-2.5" /> Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Instant interactive link for friends & family
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-90"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Place Showcase Card */}
        <div className="relative z-10 p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-[#212327] dark:to-[#1b1c1f] border border-slate-200/90 dark:border-white/5 mb-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 leading-snug">
                {description || "Explore Delhi's vibrant landmarks, food, and culture in real time."}
              </p>
            </div>
          </div>

          {/* Clean URL badge with one-click copy */}
          <div className="mt-3 flex items-center gap-2 bg-white dark:bg-[#121315] p-1.5 pl-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 truncate flex-1 select-all">
              {shareUrl}
            </span>
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-95"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary Action: Modern WhatsApp Button with Brand Aesthetic */}
        <div className="relative z-10 flex flex-col gap-2.5">
          <button
            onClick={handleWhatsAppShare}
            className="group relative w-full py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all cursor-pointer"
          >
            {/* Custom WhatsApp Vector Icon */}
            <svg
              className="w-5 h-5 fill-white transition-transform group-hover:scale-110"
              viewBox="0 0 24 24"
            >
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67ZM9.14 7.78C8.98 7.78 8.74 7.84 8.53 8.07C8.32 8.3 7.72 8.86 7.72 10.01C7.72 11.16 8.56 12.27 8.68 12.43C8.8 12.59 10.3 14.9 12.6 15.9C14.52 16.73 14.91 16.57 15.33 16.53C15.75 16.49 16.69 15.98 16.88 15.43C17.07 14.88 17.07 14.41 17.01 14.31C16.95 14.21 16.8 14.15 16.56 14.03C16.32 13.91 15.15 13.33 14.93 13.25C14.71 13.17 14.55 13.13 14.39 13.37C14.23 13.61 13.78 14.15 13.64 14.31C13.5 14.47 13.36 14.49 13.12 14.37C12.88 14.25 12.11 14 11.19 13.18C10.47 12.54 9.99 11.75 9.85 11.51C9.71 11.27 9.83 11.14 9.95 11.02C10.06 10.91 10.2 10.73 10.32 10.59C10.44 10.45 10.48 10.35 10.56 10.19C10.64 10.03 10.6 9.89 10.54 9.77C10.48 9.65 10.02 8.52 9.83 8.06C9.64 7.62 9.45 7.68 9.31 7.67L8.87 7.67C8.87 7.67 9.14 7.78 9.14 7.78Z" />
            </svg>
            <span>Share directly on WhatsApp</span>
          </button>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-2 gap-2.5">
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                onClick={handleNativeShare}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 active:scale-95 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200/60 dark:border-white/5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                <span>Other Apps</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className={`py-2.5 px-4 rounded-xl active:scale-95 font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                typeof navigator !== "undefined" && typeof navigator.share === "function"
                  ? ""
                  : "col-span-2"
              } ${
                copied
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-white/5"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Copy Full Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info tip */}
        <p className="relative z-10 text-[10.5px] text-center text-slate-400 dark:text-slate-500 mt-4 leading-normal">
          Recipient will open this map view with the exact zoom, place, and active filters.
        </p>
      </div>
    </div>
  );
}
