"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Navigation,
  Car,
  Footprints,
  Bike,
  CornerUpRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  MapPin,
  LocateFixed,
  Loader2,
} from "lucide-react";
import { RouteData, TravelMode } from "@/types/routing";
import { DELHI_PRIMARY_LANDMARKS } from "@/lib/constants";

interface DirectionsDrawerProps {
  route: RouteData | null;
  isOpen: boolean;
  onClose: () => void;
  onChangeMode: (mode: TravelMode) => void;
  onUpdateRoute?: (
    startCoords: [number, number],
    destCoords: [number, number],
    startName: string,
    destName: string,
    mode?: TravelMode
  ) => void;
  isLoading?: boolean;
  onStartNavigation?: () => void;
}

interface SearchSuggestion {
  name: string;
  subtext: string;
  coordinates: [number, number];
  isCurrentLocation?: boolean;
}

export function DirectionsDrawer({
  route,
  isOpen,
  onClose,
  onChangeMode,
  onUpdateRoute,
  isLoading = false,
  onStartNavigation,
}: DirectionsDrawerProps) {
  const [showSteps, setShowSteps] = useState(true);

  // Predictive search inputs
  const [originInput, setOriginInput] = useState("");
  const [destInput, setDestInput] = useState("");
  const [activeField, setActiveField] = useState<"origin" | "destination" | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stored active endpoints
  const [currentOriginCoords, setCurrentOriginCoords] = useState<[number, number] | null>(null);
  const [currentDestCoords, setCurrentDestCoords] = useState<[number, number] | null>(null);

  // Sync inputs when a new route is received
  useEffect(() => {
    if (route) {
      setOriginInput(route.originName || "My Location");
      setDestInput(route.destinationName || "Selected Destination");
      setCurrentOriginCoords(route.originCoords);
      setCurrentDestCoords(route.destinationCoords);
    }
  }, [route]);

  // Autocomplete / Predictive search generator
  const searchPredictions = (query: string, field: "origin" | "destination") => {
    const q = query.trim().toLowerCase();

    // Base default recommendations (Landmarks + Current Location)
    const defaults: SearchSuggestion[] = [
      ...(field === "origin" && route?.originCoords
        ? [
            {
              name: "Your Current Location",
              subtext: "GPS Live Position",
              coordinates: route.originCoords,
              isCurrentLocation: true,
            },
          ]
        : []),
      ...DELHI_PRIMARY_LANDMARKS.slice(0, 6).map((lm) => ({
        name: lm.name,
        subtext: lm.address || "Delhi Landmark",
        coordinates: lm.coordinates as [number, number],
      })),
    ];

    if (!q) {
      setSuggestions(defaults);
      return;
    }

    // Filter local primary landmarks first for instantaneous response
    const matchedLandmarks = DELHI_PRIMARY_LANDMARKS.filter(
      (lm) =>
        lm.name.toLowerCase().includes(q) ||
        (lm.address && lm.address.toLowerCase().includes(q))
    ).map((lm) => ({
      name: lm.name,
      subtext: lm.address || "Delhi Landmark",
      coordinates: lm.coordinates as [number, number],
    }));

    if (matchedLandmarks.length >= 3) {
      setSuggestions(matchedLandmarks);
      return;
    }

    // Debounced search via /api/search for broader place matching
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setIsSearchingSuggestions(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const apiSuggestions: SearchSuggestion[] = data.map(
              (item: { displayName?: string; name?: string; category?: string; coordinates: [number, number] }) => ({
                name: item.displayName?.split(",")[0] || item.name || "Place",
                subtext: item.displayName || item.category || "Delhi NCR",
                coordinates: item.coordinates,
              })
            );
            setSuggestions([
              ...matchedLandmarks,
              ...apiSuggestions.slice(0, 5 - matchedLandmarks.length),
            ]);
            return;
          }
        }
      } catch (err) {
        console.warn("Predictive search fetch error:", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
      setSuggestions(matchedLandmarks.length > 0 ? matchedLandmarks : defaults);
    }, 400);
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (activeField === "origin") {
      setOriginInput(suggestion.name);
      setCurrentOriginCoords(suggestion.coordinates);
      setActiveField(null);

      if (currentDestCoords && onUpdateRoute) {
        onUpdateRoute(
          suggestion.coordinates,
          currentDestCoords,
          suggestion.name,
          destInput || "Destination",
          route?.mode
        );
      }
    } else if (activeField === "destination") {
      setDestInput(suggestion.name);
      setCurrentDestCoords(suggestion.coordinates);
      setActiveField(null);

      if (currentOriginCoords && onUpdateRoute) {
        onUpdateRoute(
          currentOriginCoords,
          suggestion.coordinates,
          originInput || "Starting Point",
          suggestion.name,
          route?.mode
        );
      }
    }
  };

  const handleSwapEndpoints = () => {
    if (!currentOriginCoords || !currentDestCoords) return;

    const nextOriginName = destInput;
    const nextDestName = originInput;
    const nextOriginCoords = currentDestCoords;
    const nextDestCoords = currentOriginCoords;

    setOriginInput(nextOriginName);
    setDestInput(nextDestName);
    setCurrentOriginCoords(nextOriginCoords);
    setCurrentDestCoords(nextDestCoords);

    if (onUpdateRoute) {
      onUpdateRoute(
        nextOriginCoords,
        nextDestCoords,
        nextOriginName,
        nextDestName,
        route?.mode
      );
    }
  };

  if (!isOpen || !route) return null;

  return (
    <div className="fixed top-20 sm:top-4 right-3 sm:right-4 z-40 w-[calc(100vw-24px)] sm:w-[390px] max-h-[85vh] bg-white/95 dark:bg-[#1f2023]/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-250 select-none text-slate-900 dark:text-slate-100">
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
                Live Turn-by-Turn Navigation
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

        {/* Dual Predictive Search Inputs (Origin & Destination) */}
        <div className="relative bg-slate-50 dark:bg-black/30 p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 mb-3 space-y-2">
          {/* Origin Input */}
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 focus-within:border-blue-500 transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <input
              type="text"
              value={originInput}
              placeholder="Choose starting point / Live GPS..."
              onChange={(e) => {
                setOriginInput(e.target.value);
                setActiveField("origin");
                searchPredictions(e.target.value, "origin");
              }}
              onFocus={() => {
                setActiveField("origin");
                searchPredictions(originInput, "origin");
              }}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            {originInput && (
              <button
                type="button"
                onClick={() => {
                  setOriginInput("");
                  setActiveField("origin");
                  searchPredictions("", "origin");
                }}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Destination Input */}
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 focus-within:border-blue-500 transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <input
              type="text"
              value={destInput}
              placeholder="Choose destination..."
              onChange={(e) => {
                setDestInput(e.target.value);
                setActiveField("destination");
                searchPredictions(e.target.value, "destination");
              }}
              onFocus={() => {
                setActiveField("destination");
                searchPredictions(destInput, "destination");
              }}
              className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            {destInput && (
              <button
                type="button"
                onClick={() => {
                  setDestInput("");
                  setActiveField("destination");
                  searchPredictions("", "destination");
                }}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Swap Button (⇅) */}
          <button
            onClick={handleSwapEndpoints}
            title="Swap Origin and Destination"
            aria-label="Swap Route Endpoints"
            className="absolute right-4 top-[50%] -translate-y-[50%] p-1.5 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Predictive Suggestions Dropdown */}
        {activeField && suggestions.length > 0 && (
          <div className="mb-3 max-h-48 overflow-y-auto bg-white dark:bg-[#18191c] rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-lg divide-y divide-slate-100 dark:divide-white/5 animate-in fade-in duration-150">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Predictive Locations ({activeField})</span>
              {isSearchingSuggestions && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            </div>
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(sug)}
                className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                {sug.isCurrentLocation ? (
                  <LocateFixed className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {sug.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {sug.subtext}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Journey Summary Box */}
        <div className="bg-blue-50/70 dark:bg-blue-950/40 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-blue-600 dark:text-blue-400">
              {isLoading ? (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  Calculating route...
                </span>
              ) : (
                route.durationText
              )}
            </div>
            {!isLoading && (
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {route.distanceText} via fastest road
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200/50">
              Optimal Route
            </span>
          </div>
        </div>

        {/* Start Live Navigation Simulation Button */}
        {onStartNavigation && (
          <button
            onClick={onStartNavigation}
            className="w-full mt-3 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <Navigation className="w-4 h-4 fill-white" />
            <span>Start Live Navigation Preview</span>
          </button>
        )}
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
