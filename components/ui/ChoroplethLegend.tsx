"use client";

import React, { useState } from "react";
import { DistrictProperties } from "@/types/geojson";
import { Layers, ChevronDown, ChevronUp, X, MapPin } from "lucide-react";

interface ChoroplethLegendProps {
  visible: boolean;
  activeMetric: "density" | "population" | "literacyRate";
  selectedDistrict: DistrictProperties | null;
  onCloseDistrict: () => void;
  onChangeMetric: (metric: "density" | "population" | "literacyRate") => void;
  onToggleVisible?: () => void;
}

export function ChoroplethLegend({
  visible,
  activeMetric,
  selectedDistrict,
  onCloseDistrict,
  onChangeMetric,
  onToggleVisible,
}: ChoroplethLegendProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!visible) return null;

  const densityGrades = [
    { label: "> 25k /km²", color: "#800026" },
    { label: "20k – 25k", color: "#BD0026" },
    { label: "15k – 20k", color: "#E31A1C" },
    { label: "10k – 15k", color: "#FC4E2A" },
    { label: "5k – 10k", color: "#FD8D3C" },
    { label: "< 5k /km²", color: "#FEB24C" },
  ];

  const populationGrades = [
    { label: "> 3.0M", color: "#4a1486" },
    { label: "2.5M – 3.0M", color: "#6a51a3" },
    { label: "2.0M – 2.5M", color: "#807dba" },
    { label: "1.5M – 2.0M", color: "#9e9ac8" },
    { label: "1.0M – 1.5M", color: "#bcbddc" },
    { label: "< 1.0M", color: "#dadaeb" },
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
    <div className="absolute top-24 sm:top-28 right-3 sm:right-4 z-20 flex flex-col gap-2 max-w-[270px] pointer-events-auto select-none">
      {/* Metric Switcher & Legend Pill Box */}
      <div className="bg-white/95 dark:bg-[#1f2023]/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-200/90 dark:border-slate-700/80 transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100">
              Delhi Districts
            </span>
            <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              11
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title={isMinimized ? "Expand" : "Collapse"}
            >
              {isMinimized ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
            {onToggleVisible && (
              <button
                onClick={onToggleVisible}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Hide Districts Layer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Metric Switch Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl mb-2.5 text-[10px]">
              <button
                onClick={() => onChangeMetric("density")}
                className={`py-1 rounded-lg font-semibold transition-all ${
                  activeMetric === "density"
                    ? "bg-white dark:bg-blue-600 text-slate-900 dark:text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Density
              </button>
              <button
                onClick={() => onChangeMetric("population")}
                className={`py-1 rounded-lg font-semibold transition-all ${
                  activeMetric === "population"
                    ? "bg-white dark:bg-blue-600 text-slate-900 dark:text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Pop.
              </button>
              <button
                onClick={() => onChangeMetric("literacyRate")}
                className={`py-1 rounded-lg font-semibold transition-all ${
                  activeMetric === "literacyRate"
                    ? "bg-white dark:bg-blue-600 text-slate-900 dark:text-white font-bold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Literacy
              </button>
            </div>

            {/* Color Ramp */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {activeGrades.map((g, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300"
                >
                  <span
                    className="w-3 h-3 rounded-xs shrink-0 shadow-2xs border border-white/30"
                    style={{ backgroundColor: g.color }}
                  />
                  <span className="truncate">{g.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Selected District Metadata Popover */}
      {selectedDistrict && (
        <div className="bg-white/95 dark:bg-[#1f2023]/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border-2 border-blue-500/80 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  {selectedDistrict.name}
                </h4>
              </div>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold ml-5">
                {selectedDistrict.hindiName}
              </p>
            </div>
            <button
              onClick={onCloseDistrict}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Headquarters:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {selectedDistrict.headquarters}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Population:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {selectedDistrict.population?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Density:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {selectedDistrict.density?.toLocaleString()} /km²
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Literacy:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {selectedDistrict.literacyRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Area:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {selectedDistrict.areaKm2} km²
              </span>
            </div>

            {selectedDistrict.subDivisions && selectedDistrict.subDivisions.length > 0 && (
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  Sub-Divisions
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedDistrict.subDivisions.map((sub, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
