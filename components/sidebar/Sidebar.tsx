"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Search,
  ChevronRight,
  Info,
  X,
  Compass,
} from "lucide-react";
import { DELHI_PRIMARY_LANDMARKS } from "@/lib/constants";
import { LandmarkLocation } from "@/types/map";

interface SidebarProps {
  selectedLandmark: LandmarkLocation | null;
  onSelectLandmark: (landmark: LandmarkLocation) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  selectedLandmark,
  onSelectLandmark,
  isOpen,
  onCloseMobile,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Places", count: DELHI_PRIMARY_LANDMARKS.length },
    { id: "monument", label: "Monuments", count: 2 },
    { id: "heritage", label: "Heritage", count: 2 },
    { id: "religious", label: "Religious", count: 1 },
    { id: "commercial", label: "Commercial", count: 1 },
  ];

  const filteredLandmarks = DELHI_PRIMARY_LANDMARKS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.hindiName && item.hindiName.includes(searchQuery)) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-[100dvh] w-[85vw] max-w-sm sm:w-96 bg-white dark:bg-[#0c1328] border-r border-slate-200 dark:border-slate-800/80 flex flex-col shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header with Uploaded Custom Logo */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-white dark:bg-[#0c1328]">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md shrink-0 bg-slate-50 dark:bg-slate-800">
              <Image
                src="/brand/icon-192.png"
                alt="Delhi Explorer Logo"
                width={44}
                height={44}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  Delhi Explorer
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Capital Geospatial Guide
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Section */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800/60 space-y-2.5 shrink-0 bg-slate-50/70 dark:bg-[#090f20]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search places, history, metro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#121b38] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#121b38] dark:text-slate-300 dark:hover:bg-[#19254c]"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[9px] px-1 rounded-full ${
                    selectedCategory === cat.id
                      ? "bg-blue-800 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Places List (Synced with Map Markers with smooth modern scrollbar) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 overscroll-contain">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Locations</span>
            <span>{filteredLandmarks.length} results</span>
          </div>

          {filteredLandmarks.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Compass className="w-8 h-8 mx-auto mb-2 opacity-40 animate-bounce" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No matching landmarks
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Try a different keyword or category
              </p>
            </div>
          ) : (
            filteredLandmarks.map((landmark) => {
              const isSelected = selectedLandmark?.id === landmark.id;
              return (
                <button
                  key={landmark.id}
                  onClick={() => {
                    onSelectLandmark(landmark);
                    if (window.innerWidth < 1024) {
                      onCloseMobile();
                    }
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 group active:scale-[0.98] ${
                    isSelected
                      ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-sm"
                      : "bg-white dark:bg-[#101935]/70 border-slate-200/80 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-[#162145] text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-slate-700"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3
                        className={`text-xs font-bold truncate ${
                          isSelected
                            ? "text-blue-950 dark:text-blue-200"
                            : "text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {landmark.name}
                      </h3>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-[#162145] text-slate-500 dark:text-slate-400">
                        {landmark.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {landmark.description}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                      <span>
                        {landmark.coordinates[0].toFixed(3)}°N,{" "}
                        {landmark.coordinates[1].toFixed(3)}°E
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected
                        ? "text-blue-600 dark:text-blue-400 translate-x-0.5"
                        : "text-slate-300 dark:text-slate-600 group-hover:text-slate-500"
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Info Box */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#090f20] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>Interactive Map Active</span>
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Delhi NCT
          </span>
        </div>
      </aside>
    </>
  );
}
