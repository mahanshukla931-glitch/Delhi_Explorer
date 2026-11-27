"use client";

import React from "react";
import { LandmarkLocation } from "@/types/map";
import {
  Calendar,
  Building2,
  Train,
  Navigation,
  X,
  ExternalLink,
} from "lucide-react";

interface InfoPanelProps {
  landmark: LandmarkLocation | null;
  onClose: () => void;
  onFlyTo: (coords: [number, number]) => void;
}

export function InfoPanel({ landmark, onClose, onFlyTo }: InfoPanelProps) {
  if (!landmark) return null;

  const categoryColors: Record<string, string> = {
    monument: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/50",
    heritage: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50",
    religious: "bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-900/50",
    commercial: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50",
  };

  return (
    <div className="fixed sm:absolute bottom-3 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-30 sm:w-96 max-h-[82vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
            {landmark.name}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2.5">
        <span
          className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
            categoryColors[landmark.category] || "bg-slate-100 text-slate-600"
          }`}
        >
          {landmark.category}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {landmark.coordinates[0].toFixed(4)}°N, {landmark.coordinates[1].toFixed(4)}°E
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
        {landmark.description}
      </p>

      {/* Meta Specifications */}
      <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-3">
        {landmark.builtYear && (
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Period / Built:</span>
            <span className="font-medium ml-auto">{landmark.builtYear}</span>
          </div>
        )}
        {landmark.architect && (
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px]">Architect:</span>
            <span className="font-medium ml-auto truncate max-w-[170px]">
              {landmark.architect}
            </span>
          </div>
        )}
        {landmark.metroStation && (
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Train className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-400 text-[11px]">Nearest Metro:</span>
            <span className="font-medium ml-auto text-blue-600 dark:text-blue-400 text-[11px] truncate max-w-[170px]">
              {landmark.metroStation}
            </span>
          </div>
        )}
      </div>

      {/* Highlights */}
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Highlights
        </p>
        <div className="flex flex-wrap gap-1">
          {landmark.highlights.map((h, i) => (
            <span
              key={i}
              className="text-[10px] sm:text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-medium"
            >
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onFlyTo(landmark.coordinates)}
          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5" />
          Fly To Marker
        </button>

        <a
          href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
            landmark.name + " Delhi India"
          )}`}
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
          title="View on OpenStreetMap"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
