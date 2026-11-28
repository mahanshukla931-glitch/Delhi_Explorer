"use client";

import React from "react";
import {
  Sparkles,
  MapPin,
  Train,
  Crosshair,
  Loader2,
} from "lucide-react";

interface MobileBottomBarProps {
  onOpenPlacesExplorer: () => void;
  onOpenAi: () => void;
  showMetroLines: boolean;
  onToggleMetroLines: () => void;
  onLocateUser: () => void;
  isLocating?: boolean;
}

export function MobileBottomBar({
  onOpenPlacesExplorer,
  onOpenAi,
  showMetroLines,
  onToggleMetroLines,
  onLocateUser,
  isLocating = false,
}: MobileBottomBarProps) {
  return (
    <div className="sm:hidden fixed bottom-3 left-3 right-3 z-30 pointer-events-auto">
      <div className="bg-white/95 dark:bg-[#1a1b1e]/95 backdrop-blur-xl rounded-2xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-slate-200/90 dark:border-white/10 flex items-center justify-around">
        {/* 1. Explore Places Drawer */}
        <button
          onClick={onOpenPlacesExplorer}
          aria-label="Explore Delhi Places"
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all"
        >
          <MapPin className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          <span className="text-[10px] font-bold mt-0.5">Places</span>
        </button>

        {/* 2. Metro Lines Toggle */}
        <button
          onClick={onToggleMetroLines}
          aria-label="Toggle Delhi Metro Lines"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all active:scale-95 ${
            showMetroLines
              ? "text-amber-600 dark:text-amber-400 font-extrabold"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
          }`}
        >
          <Train className="w-4.5 h-4.5 text-amber-500" />
          <span className="text-[10px] font-bold mt-0.5">Metro</span>
        </button>

        {/* 3. Center Ask AI Action */}
        <button
          onClick={onOpenAi}
          aria-label="Ask Delhi Explorer AI Copilot"
          className="flex flex-col items-center justify-center py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-[10px] font-extrabold mt-0.5">Ask AI</span>
        </button>

        {/* 4. Locate Me GPS */}
        <button
          onClick={onLocateUser}
          disabled={isLocating}
          aria-label="Locate My GPS Location"
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="w-4.5 h-4.5 text-blue-600 animate-spin" />
          ) : (
            <Crosshair className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
          )}
          <span className="text-[10px] font-bold mt-0.5">Locate</span>
        </button>
      </div>
    </div>
  );
}
