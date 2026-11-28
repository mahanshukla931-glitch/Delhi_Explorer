import React from "react";
import { Compass } from "lucide-react";
import Image from "next/image";

export function MapLoadingSkeleton() {
  return (
    <div className="w-full h-full min-h-[500px] relative overflow-hidden bg-slate-100 dark:bg-[#1a1b1e] select-none text-slate-600 dark:text-slate-300">
      {/* High-priority instant base map paint for Lighthouse LCP < 1.0s */}
      <Image
        src="/brand/delhi-basemap.webp"
        alt="Delhi Basemap Overview"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-60 dark:opacity-40 filter saturate-75"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center p-5 rounded-2xl bg-white/90 dark:bg-[#202124]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/60 shadow-xl max-w-xs text-center">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2.5 shadow-md">
            <Compass className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            Delhi Explorer
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Loading interactive map & landmarks...
          </p>
        </div>
      </div>
    </div>
  );
}
