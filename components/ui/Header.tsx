"use client";

import React from "react";
import Image from "next/image";
import {
  Menu,
  Sun,
  Moon,
  AlertCircle,
  X,
} from "lucide-react";
import { LayerType } from "@/types/map";

interface HeaderProps {
  onToggleSidebar: () => void;
  activeLayer: LayerType;
  onChangeLayer: (layer: LayerType) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  errorNotice: string | null;
  onDismissError: () => void;
}

export function Header({
  onToggleSidebar,
  activeLayer,
  onChangeLayer,
  isDarkMode,
  onToggleDarkMode,
  errorNotice,
  onDismissError,
}: HeaderProps) {
  return (
    <header className="h-14 sm:h-16 bg-white/95 dark:bg-[#0c1328]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-4 flex items-center justify-between shrink-0 z-20 transition-colors">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleSidebar}
          aria-label="Open sidebar"
          className="p-2 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden active:scale-95"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand identity on mobile & desktop */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
            <Image
              src="/brand/icon-192.png"
              alt="Logo"
              width={36}
              height={36}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                Delhi Explorer
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Interactive Geospatial Map
            </p>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorNotice && (
        <div className="mx-2 flex items-center gap-2 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-[11px] max-w-xs sm:max-w-md animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          <span className="truncate">{errorNotice}</span>
          <button
            onClick={onDismissError}
            className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-900 rounded shrink-0"
            aria-label="Dismiss message"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Right Action Icons & Layer Switchers */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Layer Selector Pill */}
        <div className="flex items-center bg-slate-100 dark:bg-[#121b38] p-1 rounded-xl text-xs font-medium border border-transparent dark:border-slate-800/60">
          <button
            onClick={() => onChangeLayer("osm")}
            className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
              activeLayer === "osm"
                ? "bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Street
          </button>
          <button
            onClick={() => onChangeLayer("satellite")}
            className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
              activeLayer === "satellite"
                ? "bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => onChangeLayer("dark")}
            className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all text-[11px] sm:text-xs ${
              activeLayer === "dark"
                ? "bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Night
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle dark mode"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121b38] flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs active:scale-95"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-in zoom-in-75 duration-200" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 animate-in zoom-in-75 duration-200" />
          )}
        </button>
      </div>
    </header>
  );
}
