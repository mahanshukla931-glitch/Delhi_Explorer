"use client";

import React from "react";
import {
  Sparkles,
  MapPin,
  Eye,
  EyeOff,
  Train,
  Crosshair,
  Loader2,
} from "lucide-react";

interface MobileBottomBarProps {
  isClearMap: boolean;
  onToggleClearMap: () => void;
  onOpenPlacesExplorer: () => void;
  onOpenAi: () => void;
  showMetroLines: boolean;
  onToggleMetroLines: () => void;
  onLocateUser: () => void;
  isLocating?: boolean;
}

export function MobileBottomBar({
  isClearMap,
  onToggleClearMap,
  onOpenPlacesExplorer,
  onOpenAi,
  showMetroLines,
  onToggleMetroLines,
  onLocateUser,
  isLocating = false,
}: MobileBottomBarProps) {
  return (
    <>
      {/* Floating Compact Clear Map Toggle Pill on Mobile:
          Positioned below the search bar to avoid overlapping search/input icons */}
      <div className="sm:hidden fixed top-[110px] right-3 z-30 pointer-events-auto">
        <button
          onClick={onToggleClearMap}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-lg backdrop-blur-md transition-all active:scale-95 border ${
            isClearMap
              ? "bg-blue-600 text-white border-blue-500 shadow-blue-500/30 ring-2 ring-blue-400/40"
              : "bg-white/95 dark:bg-[#1a1b1e]/95 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-50"
          }`}
          aria-label="Toggle Clear Map"
        >
          {isClearMap ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Show UI</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Clear Map</span>
            </>
          )}
        </button>
      </div>

      {/* Modern Floating Bottom Nav Bar for Mobile (Hidden when Clear Map is active) */}
      {!isClearMap && (
        <div className="sm:hidden fixed bottom-3 left-3 right-3 z-30 pointer-events-auto">
          <div className="bg-white/95 dark:bg-[#1a1b1e]/95 backdrop-blur-xl rounded-2xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-slate-200/90 dark:border-white/10 flex items-center justify-around">
            {/* 1. Explore Places Drawer */}
            <button
              onClick={onOpenPlacesExplorer}
              className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all"
            >
              <MapPin className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-bold mt-0.5">Places</span>
            </button>

            {/* 2. Metro Lines Toggle */}
            <button
              onClick={onToggleMetroLines}
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
              className="flex flex-col items-center justify-center py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-[10px] font-extrabold mt-0.5">Ask AI</span>
            </button>

            {/* 4. Locate Me GPS */}
            <button
              onClick={onLocateUser}
              disabled={isLocating}
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
      )}
    </>
  );
}
