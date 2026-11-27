"use client";

import React, { useState } from "react";
import {
  X,
  Navigation,
  Car,
  Footprints,
  Bike,
  CornerUpRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RouteData, TravelMode } from "@/types/routing";

interface DirectionsDrawerProps {
  route: RouteData | null;
  isOpen: boolean;
  onClose: () => void;
  onChangeMode: (mode: TravelMode) => void;
  isLoading?: boolean;
}

export function DirectionsDrawer({
  route,
  isOpen,
  onClose,
  onChangeMode,
  isLoading = false,
}: DirectionsDrawerProps) {
  const [showSteps, setShowSteps] = useState(true);

  if (!isOpen || !route) return null;

  return (
    <div className="fixed top-20 sm:top-4 right-3 sm:right-4 z-40 w-[calc(100vw-24px)] sm:w-[380px] max-h-[82vh] bg-white/95 dark:bg-[#1f2023]/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-250 select-none text-slate-900 dark:text-slate-100">
      {/* Top Header Card */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Navigation className="w-4.5 h-4.5 fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight">Directions</h3>
              <span className="text-[10px] text-slate-400 font-medium">
                Live OSRM Navigation
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Close Directions"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Travel Mode Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-3">
          <button
            onClick={() => onChangeMode("driving")}
            disabled={isLoading}
            className={`py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              route.mode === "driving"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Drive</span>
          </button>

          <button
            onClick={() => onChangeMode("walking")}
            disabled={isLoading}
            className={`py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              route.mode === "walking"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Walk</span>
          </button>

          <button
            onClick={() => onChangeMode("cycling")}
            disabled={isLoading}
            className={`py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              route.mode === "cycling"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Cycle</span>
          </button>
        </div>

        {/* Journey Summary Box */}
        <div className="bg-blue-50/70 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400">
              {route.durationText}
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {route.distanceText} via fastest route
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200/50">
              Optimal Road
            </span>
          </div>
        </div>

        {/* Route Endpoints */}
        <div className="mt-3 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">From:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
              {route.originName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">To:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
              {route.destinationName}
            </span>
          </div>
        </div>
      </div>

      {/* Step by Step Navigation Directions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Turn-by-Turn Steps ({route.steps.length})
          </span>
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5"
          >
            <span>{showSteps ? "Hide" : "Show"}</span>
            {showSteps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showSteps && (
          <div className="space-y-2.5">
            {route.steps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-start gap-3 hover:bg-slate-100/80 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CornerUpRight className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
                    {step.instruction}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10.5px] text-slate-400 font-medium">
                    {step.distanceMeters > 0 && <span>{step.distanceMeters} m</span>}
                    {step.durationSeconds > 0 && <span>• {Math.round(step.durationSeconds / 60)} min</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
