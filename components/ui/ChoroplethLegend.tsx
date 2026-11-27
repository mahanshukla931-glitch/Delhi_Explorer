"use client";

import React from "react";
import { DistrictProperties } from "@/types/geojson";

interface ChoroplethLegendProps {
  visible: boolean;
  activeMetric: "density" | "population" | "literacyRate";
  selectedDistrict: DistrictProperties | null;
  onCloseDistrict: () => void;
  onChangeMetric: (metric: "density" | "population" | "literacyRate") => void;
}

export function ChoroplethLegend({
  visible,
  activeMetric,
  selectedDistrict,
  onCloseDistrict,
  onChangeMetric,
}: ChoroplethLegendProps) {
  if (!visible) return null;

  const densityGrades = [
    { label: "> 25,000 /km²", color: "#800026" },
    { label: "20k – 25k", color: "#BD0026" },
    { label: "15k – 20k", color: "#E31A1C" },
    { label: "10k – 15k", color: "#FC4E2A" },
    { label: "5k – 10k", color: "#FD8D3C" },
    { label: "< 5,000 /km²", color: "#FEB24C" },
  ];

  const populationGrades = [
    { label: "> 3 Million", color: "#4a1486" },
    { label: "2.5M – 3.0M", color: "#6a51a3" },
    { label: "2.0M – 2.5M", color: "#807dba" },
    { label: "1.5M – 2.0M", color: "#9e9ac8" },
    { label: "1.0M – 1.5M", color: "#bcbddc" },
    { label: "< 1 Million", color: "#dadaeb" },
  ];

  const literacyGrades = [
    { label: "> 88%", color: "#005a32" },
    { label: "87% – 88%", color: "#238b45" },
    { label: "86% – 87%", color: "#41ab5d" },
    { label: "85% – 86%", color: "#74c476" },
    { label: "< 85%", color: "#a1d99b" },
  ];

  const activeGrades =
    activeMetric === "density"
      ? densityGrades
      : activeMetric === "population"
      ? populationGrades
      : literacyGrades;

  return (
    <div className="absolute top-20 right-3 sm:top-4 sm:right-4 z-30 flex flex-col gap-2 max-w-[280px]">
      {/* Metric Switcher & Legend Pill Box */}
      <div className="bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md rounded-2xl p-3 shadow-[0_4px_16px_rgba(0,0,0,0.2)] border border-slate-200/80 dark:border-slate-700/60">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2 mb-2">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
            Delhi Districts Choropleth
          </span>
          <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
            GeoJSON
          </span>
        </div>

        {/* Metric Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg mb-2 text-[10px]">
          <button
            onClick={() => onChangeMetric("density")}
            className={`py-1 rounded font-medium transition-all ${
              activeMetric === "density"
                ? "bg-white dark:bg-blue-600 text-slate-900 dark:text-white font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Density
          </button>
          <button
            onClick={() => onChangeMetric("population")}
            className={`py-1 rounded font-medium transition-all ${
              activeMetric === "population"
                ? "bg-white dark:bg-blue-600 text-slate-900 dark:text-white font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Pop.
          </button>
          <button
            onClick={() => onChangeMetric("literacyRate")}
            className={`py-1 rounded font-medium transition-all ${
              activeMetric === "literacyRate"
                ? "bg-white dark:bg-blue-600 text-slate-900 dark:text-white font-bold shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Literacy
          </button>
        </div>

        {/* Color Ramp */}
        <div className="space-y-1">
          {activeGrades.map((g, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300">
              <span
                className="w-3.5 h-3.5 rounded-xs shrink-0 shadow-xs"
                style={{ backgroundColor: g.color }}
              />
              <span>{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected District Metadata Popover */}
      {selectedDistrict && (
        <div className="bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md rounded-2xl p-3 shadow-[0_4px_16px_rgba(0,0,0,0.25)] border border-blue-400 dark:border-blue-600 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-1.5 mb-1.5">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {selectedDistrict.name}
              </h4>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                {selectedDistrict.hindiName}
              </p>
            </div>
            <button
              onClick={onCloseDistrict}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">HQ:</span>
              <span className="font-semibold">{selectedDistrict.headquarters}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Population:</span>
              <span className="font-semibold">{selectedDistrict.population.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Density:</span>
              <span className="font-semibold">{selectedDistrict.density.toLocaleString()} /km²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Literacy:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {selectedDistrict.literacyRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Area:</span>
              <span className="font-semibold">{selectedDistrict.areaKm2} km²</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
