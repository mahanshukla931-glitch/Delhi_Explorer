"use client";

import React, { useEffect, useState } from "react";
import {
  Navigation,
  X,
  CornerUpRight,
  Gauge,
  CheckCircle,
} from "lucide-react";
import { RouteData } from "@/types/routing";

interface NavigationSimulationBannerProps {
  route: RouteData;
  isActive: boolean;
  onExit: () => void;
  onPositionUpdate?: (coords: [number, number]) => void;
}

export function NavigationSimulationBanner({
  route,
  isActive,
  onExit,
  onPositionUpdate,
}: NavigationSimulationBannerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentCoordIndex, setCurrentCoordIndex] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(38);

  useEffect(() => {
    if (!isActive || !route || !route.coordinates.length) return;

    // Reset to start on activation
    setCurrentCoordIndex(0);
    setCurrentStepIndex(0);

    const interval = setInterval(() => {
      setCurrentCoordIndex((prev) => {
        const next = prev + 1;
        if (next >= route.coordinates.length) {
          clearInterval(interval);
          return prev;
        }
        onPositionUpdate?.(route.coordinates[next]);
        return next;
      });

      // Random natural road speed variation (32 - 48 km/h)
      setSpeedKmh(Math.floor(32 + Math.random() * 16));
    }, 1200);

    return () => clearInterval(interval);
  }, [isActive, route]);

  // Sync turn-by-turn step with progress
  useEffect(() => {
    if (!route || !route.steps.length) return;
    const progressRatio = currentCoordIndex / Math.max(1, route.coordinates.length - 1);
    const stepIdx = Math.min(
      Math.floor(progressRatio * route.steps.length),
      route.steps.length - 1
    );
    setCurrentStepIndex(stepIdx);
  }, [currentCoordIndex, route]);

  if (!isActive || !route) return null;

  const currentStep = route.steps[currentStepIndex] || route.steps[0];
  const isArrived = currentCoordIndex >= route.coordinates.length - 1;

  return (
    <div className="fixed top-3 sm:top-5 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 z-50 sm:w-[500px] select-none animate-in fade-in slide-in-from-top-4 duration-250">
      <div className="bg-emerald-700 dark:bg-emerald-800 text-white rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.35)] border border-emerald-500/50 p-3.5 sm:p-4">
        {/* Top Header Row: Maneuver + Instruction */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              {isArrived ? (
                <CheckCircle className="w-6 h-6 text-emerald-200" />
              ) : (
                <CornerUpRight className="w-6 h-6 text-white stroke-[2.5]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                {isArrived ? "Destination Reached" : "Next Maneuver"}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold leading-tight text-white line-clamp-2">
                {isArrived ? `You have arrived at ${route.destinationName}` : currentStep?.instruction}
              </h3>
            </div>
          </div>

          <button
            onClick={onExit}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors shrink-0"
            title="Exit Navigation"
            aria-label="Exit Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Metrics Bar: Speed, Distance Left, ETA */}
        <div className="mt-3 pt-3 border-t border-emerald-600/60 flex items-center justify-between text-xs font-bold text-emerald-100">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-300" />
            <span>{isArrived ? "0 km/h" : `${speedKmh} km/h`}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-300" />
            <span>{route.distanceText}</span>
          </div>

          <div className="bg-black/25 px-2.5 py-1 rounded-full text-white text-[11px] font-black border border-white/10">
            {isArrived ? "Arrived" : route.durationText}
          </div>
        </div>
      </div>
    </div>
  );
}
