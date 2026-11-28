"use client";

import React, { useEffect, useState } from "react";
import {
  Navigation,
  X,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  RotateCw,
  GitFork,
  Gauge,
  CheckCircle,
  LocateFixed,
} from "lucide-react";
import { RouteData } from "@/types/routing";

interface NavigationSimulationBannerProps {
  route: RouteData;
  isActive: boolean;
  onExit: () => void;
  onPositionUpdate?: (coords: [number, number], bearing: number) => void;
  onRecenter?: () => void;
}

// Calculate bearing between two GPS points in degrees (0 - 360)
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

// Helper to pick accurate maneuver turn icon based on OSRM type and modifier
function getManeuverIcon(type?: string, modifier?: string) {
  if (modifier?.includes("left")) {
    return <CornerUpLeft className="w-6 h-6 text-white stroke-[2.5]" />;
  }
  if (modifier?.includes("right")) {
    return <CornerUpRight className="w-6 h-6 text-white stroke-[2.5]" />;
  }
  if (type === "roundabout" || type === "rotary" || type === "roundabout turn") {
    return <RotateCw className="w-6 h-6 text-white stroke-[2.5]" />;
  }
  if (type === "fork") {
    return <GitFork className="w-6 h-6 text-white stroke-[2.5]" />;
  }
  return <ArrowUp className="w-6 h-6 text-white stroke-[2.5]" />;
}

export function NavigationSimulationBanner({
  route,
  isActive,
  onExit,
  onPositionUpdate,
  onRecenter,
}: NavigationSimulationBannerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentCoordIndex, setCurrentCoordIndex] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(38);

  useEffect(() => {
    if (!isActive || !route || !route.coordinates.length) return;

    // Reset to start on activation
    setCurrentCoordIndex(0);
    setCurrentStepIndex(0);

    // Initial position dispatch
    if (route.coordinates.length > 1) {
      const b = calculateBearing(
        route.coordinates[0][0],
        route.coordinates[0][1],
        route.coordinates[1][0],
        route.coordinates[1][1]
      );
      onPositionUpdate?.(route.coordinates[0], b);
    } else {
      onPositionUpdate?.(route.coordinates[0], 0);
    }

    const interval = setInterval(() => {
      setCurrentCoordIndex((prev) => {
        const next = prev + 1;
        if (next >= route.coordinates.length) {
          clearInterval(interval);
          return prev;
        }

        const curr = route.coordinates[prev];
        const nxt = route.coordinates[next];
        const bearing = calculateBearing(curr[0], curr[1], nxt[0], nxt[1]);
        onPositionUpdate?.(nxt, bearing);
        return next;
      });

      // Natural vehicle driving speed variation (34 - 52 km/h)
      setSpeedKmh(Math.floor(34 + Math.random() * 18));
    }, 1100);

    return () => clearInterval(interval);
  }, [isActive, route, onPositionUpdate]);

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

  // Format step distance
  const stepDistFormatted = currentStep?.distanceMeters
    ? currentStep.distanceMeters > 1000
      ? `${(currentStep.distanceMeters / 1000).toFixed(1)} km`
      : `${currentStep.distanceMeters} m`
    : "";

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
                getManeuverIcon(currentStep?.type, currentStep?.modifier)
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                {isArrived
                  ? "Destination Reached"
                  : stepDistFormatted
                  ? `In ${stepDistFormatted}`
                  : "Next Maneuver"}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold leading-tight text-white line-clamp-2">
                {isArrived
                  ? `You have arrived at ${route.destinationName}`
                  : currentStep?.instruction}
              </h3>
              {currentStep?.name && !isArrived && (
                <span className="inline-block text-[11px] font-semibold text-emerald-200/90 truncate max-w-full mt-0.5">
                  🛣️ {currentStep.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onRecenter && (
              <button
                onClick={onRecenter}
                className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-emerald-200 hover:text-white transition-colors cursor-pointer"
                title="Re-center Camera on Car"
                aria-label="Re-center Camera"
              >
                <LocateFixed className="w-4.5 h-4.5" />
              </button>
            )}
            <button
              onClick={onExit}
              className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors cursor-pointer"
              title="Exit Navigation"
              aria-label="Exit Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
