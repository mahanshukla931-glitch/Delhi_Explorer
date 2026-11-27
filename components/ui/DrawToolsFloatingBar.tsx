"use client";

import React, { useRef, useState } from "react";
import {
  Download,
  Upload,
  Trash2,
  X,
  Palette,
  Check,
  Shapes,
} from "lucide-react";
import {
  exportShapesToGeoJSON,
  importShapesFromGeoJSON,
  clearAllShapes,
} from "@/lib/shapesStorage";

interface DrawToolsFloatingBarProps {
  isOpen: boolean;
  onClose: () => void;
  activeColor?: string;
  onChangeColor?: (color: string) => void;
  onShapesImported?: (count: number) => void;
}

const DRAW_COLORS = [
  { id: "#2563eb", name: "Blue", bg: "bg-blue-600" },
  { id: "#10b981", name: "Green", bg: "bg-emerald-600" },
  { id: "#ef4444", name: "Red", bg: "bg-rose-600" },
  { id: "#f59e0b", name: "Amber", bg: "bg-amber-500" },
  { id: "#8b5cf6", name: "Purple", bg: "bg-purple-600" },
];

export function DrawToolsFloatingBar({
  isOpen,
  onClose,
  activeColor = "#2563eb",
  onChangeColor,
  onShapesImported,
}: DrawToolsFloatingBarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedColor, setSelectedColor] = useState(activeColor);

  if (!isOpen) return null;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onChangeColor?.(color);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const count = importShapesFromGeoJSON(text);
        if (count > 0) {
          onShapesImported?.(count);
          alert(`Successfully imported ${count} shape(s) from GeoJSON!`);
        } else {
          alert("No valid shapes found in file.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid file format";
        alert("Import failed: " + msg);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all drawn shapes?")) {
      clearAllShapes();
    }
  };

  return (
    <div className="fixed top-[125px] sm:top-24 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] sm:max-w-2xl bg-white/95 dark:bg-[#1e2023]/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.22)] border border-slate-200/90 dark:border-slate-700 p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs select-none animate-in fade-in slide-in-from-top-2">
      {/* 1. Header / Mode Badge */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
        <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1">
          <Shapes className="w-3.5 h-3.5 text-purple-600" />
          <span>Draw Tools</span>
        </span>
      </div>

      {/* 2. Color Palette Selector */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        <Palette className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5" />
        {DRAW_COLORS.map((col) => (
          <button
            key={col.id}
            onClick={() => handleColorSelect(col.id)}
            title={`Set color: ${col.name}`}
            className={`w-5 h-5 rounded-full ${col.bg} flex items-center justify-center transition-transform ${
              selectedColor === col.id ? "scale-110 ring-2 ring-white dark:ring-black shadow-xs" : "opacity-80 hover:opacity-100"
            }`}
          >
            {selectedColor === col.id && <Check className="w-3 h-3 text-white stroke-[3]" />}
          </button>
        ))}
      </div>

      {/* 3. Action Buttons: Export, Import, Clear, Close */}
      <div className="flex items-center gap-1.5">
        {/* Hidden File Input for GeoJSON Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import GeoJSON file"
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Import</span>
        </button>

        <button
          onClick={exportShapesToGeoJSON}
          title="Export shapes as standard .geojson file"
          className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 transition-colors shadow-xs active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export GeoJSON</span>
        </button>

        <button
          onClick={handleClearAll}
          title="Clear all saved shapes"
          className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close Draw Tools"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
