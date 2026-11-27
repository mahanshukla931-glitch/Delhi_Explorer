"use client";

import React, { useState } from "react";
import { X, Copy, Check, Share2, MessageCircle, ExternalLink } from "lucide-react";

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
    const text = `📍 Check out *${title}* on Delhi Explorer!\n${
      description ? `${description}\n` : ""
    }\n🗺️ Explore interactive map view:\n${shareUrl}`;

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
          text: `Explore ${title} on the interactive Delhi Explorer map!`,
          url: shareUrl,
        })
        .catch(() => {
          // ignore share cancel
        });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1f2023] rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100 select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Share2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight">
                Share Location View
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Live interactive map link
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Place preview card */}
        <div className="p-3 bg-slate-50 dark:bg-[#17181a] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 mb-4">
          <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
            {title}
          </div>
          {description && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {description}
            </div>
          )}
          <div className="mt-2 text-[10px] font-mono text-blue-600 dark:text-blue-400 truncate bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            {shareUrl}
          </div>
        </div>

        {/* WhatsApp Share Button */}
        <button
          onClick={handleWhatsAppShare}
          className="w-full py-2.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all mb-2.5"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>Share on WhatsApp</span>
        </button>

        {/* Secondary Actions: Native Share / Copy */}
        <div className="grid grid-cols-2 gap-2">
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button
              onClick={handleNativeShare}
              className="py-2 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              <span>More Apps</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className={`py-2 px-3 rounded-2xl active:scale-95 font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              typeof navigator !== "undefined" && typeof navigator.share === "function" ? "" : "col-span-2"
            } ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied! 🎉</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-3">
          Anyone opening this link will see this exact place and map view.
        </p>
      </div>
    </div>
  );
}
