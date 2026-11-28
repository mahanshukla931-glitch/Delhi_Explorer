import React from "react";
import { Compass } from "lucide-react";

export function MapLoadingSkeleton() {
  return (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-[#131416] dark:to-[#1a1b1f] select-none text-slate-600 dark:text-slate-300">
      {/* Premium Google Maps Style Floating Pulse Card */}
      <div className="flex flex-col items-center p-8 rounded-3xl bg-white/80 dark:bg-[#1e2024]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-blue-500/10 max-w-sm text-center">
        {/* Animated Radar Compass */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="w-20 h-20 rounded-full border-2 border-blue-100 dark:border-blue-900/40 animate-ping absolute opacity-40" />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: "3s" }} />
          </div>
        </div>

        <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight">
          Delhi Explorer
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Loading 1,200+ places, Metro & live traffic...
        </p>

        {/* Shimmer progress bar */}
        <div className="w-48 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden mt-4">
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
