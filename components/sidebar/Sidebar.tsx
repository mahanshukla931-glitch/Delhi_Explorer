"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Search,
  ChevronRight,
  X,
  Compass,
  Star,
  RotateCcw,
  SlidersHorizontal,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { MarkerPoi } from "@/types/geojson";

interface SidebarProps {
  markers: MarkerPoi[];
  selectedMarkerId: string | null;
  onSelectMarker: (marker: MarkerPoi) => void;
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  categoryCounts?: Record<string, number>;
  activeDistrictFilter?: string | null;
  onClearDistrictFilter?: () => void;
  sortBy: "recommended" | "rating" | "reviews" | "name";
  onSortChange: (sort: "recommended" | "rating" | "reviews" | "name") => void;
  isOpenNowOnly: boolean;
  onToggleOpenNowOnly: () => void;
}

export function Sidebar({
  markers,
  selectedMarkerId,
  onSelectMarker,
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  totalCount,
  categoryCounts = {},
  activeDistrictFilter,
  onClearDistrictFilter,
  sortBy,
  onSortChange,
  isOpenNowOnly,
  onToggleOpenNowOnly,
}: SidebarProps) {
  const selectedItemRef = useRef<HTMLButtonElement | null>(null);
  const [showFiltersBar, setShowFiltersBar] = useState(false);

  // Auto-scroll selected marker into view in sidebar
  useEffect(() => {
    if (selectedMarkerId && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedMarkerId]);

  const categoryList = [
    { id: "all", label: "All Places", icon: "✨", count: totalCount },
    { id: "monument", label: "Monuments", icon: "🏛️", count: categoryCounts["monument"] || 0 },
    { id: "food", label: "Food & Cafes", icon: "☕", count: categoryCounts["food"] || 0 },
    { id: "shopping", label: "Shopping", icon: "🛍️", count: categoryCounts["shopping"] || 0 },
    { id: "metro", label: "Metro & Transit", icon: "🚇", count: categoryCounts["metro"] || 0 },
    { id: "hospital", label: "Hospitals", icon: "🏥", count: categoryCounts["hospital"] || 0 },
    { id: "religious", label: "Spiritual", icon: "🛕", count: categoryCounts["religious"] || 0 },
    { id: "park", label: "Parks", icon: "🌳", count: categoryCounts["park"] || 0 },
    { id: "atm", label: "ATMs", icon: "💳", count: categoryCounts["atm"] || 0 },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-[100dvh] w-[90vw] max-w-sm sm:w-[390px] bg-white dark:bg-[#1b1c1e] border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#1b1c1e]">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 bg-slate-50 dark:bg-slate-800">
              <Image
                src="/brand/icon-192.png"
                alt="Delhi Explorer Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Places Explorer
                </h2>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {totalCount}+
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Clustered Geospatial Directory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFiltersBar(!showFiltersBar)}
              className={`p-1.5 rounded-xl transition-colors ${
                showFiltersBar || isOpenNowOnly || sortBy !== "recommended"
                  ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Filters & Sorting"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Section */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2 shrink-0 bg-slate-50/70 dark:bg-[#151618]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 1,200+ places, hubs, cafes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Active District Bridge Filter Banner */}
          {activeDistrictFilter && (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs">
              <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold truncate">
                <span>🏛️</span>
                <span className="truncate">District: {activeDistrictFilter}</span>
              </span>
              {onClearDistrictFilter && (
                <button
                  onClick={onClearDistrictFilter}
                  className="p-0.5 rounded text-blue-400 hover:text-blue-700 dark:hover:text-blue-200"
                  title="Remove district filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Collapsible Pro Sorting & Quick Filter Toolbar */}
          {(showFiltersBar || isOpenNowOnly || sortBy !== "recommended") && (
            <div className="p-2 bg-white dark:bg-[#202124] rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 animate-in fade-in text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-blue-500" />
                  <span>Sort By:</span>
                </span>
                <div className="flex gap-1 text-[10px]">
                  <button
                    onClick={() => onSortChange("recommended")}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      sortBy === "recommended"
                        ? "bg-blue-600 text-white font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => onSortChange("rating")}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      sortBy === "rating"
                        ? "bg-amber-500 text-white font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    ★ Rating
                  </button>
                  <button
                    onClick={() => onSortChange("reviews")}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      sortBy === "reviews"
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Reviews
                  </button>
                  <button
                    onClick={() => onSortChange("name")}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                      sortBy === "name"
                        ? "bg-slate-700 text-white font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    A-Z
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={onToggleOpenNowOnly}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    isOpenNowOnly
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>🟢 Open Now Only</span>
                </button>

                {(isOpenNowOnly || sortBy !== "recommended") && (
                  <button
                    onClick={() => {
                      if (isOpenNowOnly) onToggleOpenNowOnly();
                      onSortChange("recommended");
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {categoryList.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 shrink-0 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-[#202124] dark:text-slate-300 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {cat.count > 0 && (
                    <span
                      className={`text-[9px] px-1 rounded-full font-bold ${
                        isSelected
                          ? "bg-blue-800 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                      }`}
                    >
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter Bar */}
        <div className="px-4 py-2 bg-slate-100/70 dark:bg-[#161719] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <span className="font-semibold">
            Showing {markers.length} matching {markers.length === 1 ? "place" : "places"}
          </span>
          {(searchQuery || selectedCategory !== "all" || activeDistrictFilter || isOpenNowOnly) && (
            <button
              onClick={() => {
                onSearchChange("");
                onSelectCategory("all");
                if (onClearDistrictFilter) onClearDistrictFilter();
                if (isOpenNowOnly) onToggleOpenNowOnly();
                onSortChange("recommended");
              }}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold text-[10px]"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset All</span>
            </button>
          )}
        </div>

        {/* Places List (Virtualized / Smooth Scroll) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 overscroll-contain scrollbar-thin">
          {markers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 my-auto">
              <Compass className="w-10 h-10 mx-auto mb-3 opacity-30 animate-pulse text-blue-500" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                No matching locations found
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                No places found for &quot;{searchQuery || selectedCategory || activeDistrictFilter}&quot;. Try adjusting your filters.
              </p>
              <button
                onClick={() => {
                  onSearchChange("");
                  onSelectCategory("all");
                  if (onClearDistrictFilter) onClearDistrictFilter();
                  if (isOpenNowOnly) onToggleOpenNowOnly();
                  onSortChange("recommended");
                }}
                className="mt-4 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 active:scale-95 transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            markers.map((marker) => {
              const isSelected = selectedMarkerId === marker.id;
              return (
                <button
                  key={marker.id}
                  ref={isSelected ? selectedItemRef : null}
                  onClick={() => {
                    onSelectMarker(marker);
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 group active:scale-[0.99] ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 dark:border-blue-600 shadow-sm ring-1 ring-blue-500/20"
                      : "bg-white dark:bg-[#202124] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs"
                  }`}
                >
                  {/* Category Pin Badge */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                    style={{
                      backgroundColor: `${marker.categoryColor}18`,
                      color: marker.categoryColor,
                      border: `1.5px solid ${marker.categoryColor}40`,
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3
                        className={`text-xs font-extrabold truncate ${
                          isSelected
                            ? "text-blue-900 dark:text-blue-200"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {marker.name}
                      </h3>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase tracking-wide"
                        style={{
                          backgroundColor: `${marker.categoryColor}15`,
                          color: marker.categoryColor,
                        }}
                      >
                        {marker.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                      {marker.hub || marker.address}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{marker.rating}</span>
                        <span className="text-slate-400 font-normal">({marker.reviewsCount})</span>
                      </span>

                      <span
                        className={`font-bold px-1.5 py-0.2 rounded text-[9px] ${
                          marker.isOpenNow
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300"
                        }`}
                      >
                        {marker.isOpenNow ? "Open" : "Closed"}
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
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#151618] text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Live Marker API Connected
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            Delhi NCT
          </span>
        </div>
      </aside>
    </>
  );
}
