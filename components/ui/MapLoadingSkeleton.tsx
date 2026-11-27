import React from "react";
import { Loader2 } from "lucide-react";

export function MapLoadingSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 animate-pulse text-slate-500">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin" />
        <Loader2 className="w-8 h-8 text-indigo-600 absolute animate-pulse" />
      </div>
      <p className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-300">
        Initializing Delhi Explorer Map...
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        Loading tiles, coordinates & landmark geometries
      </p>
    </div>
  );
}
