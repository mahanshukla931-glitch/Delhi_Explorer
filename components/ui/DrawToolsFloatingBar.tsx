"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Download,
  Upload,
  Trash2,
  X,
  Palette,
  Check,
  Shapes,
  Pentagon,
  Ruler,
  Circle,
  Square,
  MapPin,
  Pencil,
  Eraser,
  Info,
} from "lucide-react";
import {
  exportShapesToGeoJSON,
  importShapesFromGeoJSON,
  clearAllShapes,
  loadSavedShapes,
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

const DRAW_TOOLS = [
  {
    id: "polygon",
    label: "Area",
    shortLabel: "Area",
    icon: Pentagon,
    hint: "Click on map to place points. Double-click or click first point to finish and calculate area.",
  },
  {
    id: "line",
    label: "Distance",
    shortLabel: "Dist",
    icon: Ruler,
    hint: "Click points along roads/path to measure distance. Double-click to complete.",
  },
  {
    id: "circle",
    label: "Circle",
    shortLabel: "Circle",
    icon: Circle,
    hint: "Click center and drag outwards to measure circular radius and zone.",
  },
  {
    id: "rectangle",
    label: "Box",
    shortLabel: "Box",
    icon: Square,
    hint: "Click and drag diagonally to draw a rectangular boundary.",
  },
  {
    id: "marker",
    label: "Pin",
    shortLabel: "Pin",
    icon: MapPin,
    hint: "Click anywhere on Delhi map to drop a custom marker.",
  },
  {
    id: "edit",
    label: "Edit",
    shortLabel: "Edit",
    icon: Pencil,
    hint: "Click and drag vertices of any drawn shape on map to modify.",
  },
  {
    id: "erase",
    label: "Erase",
    shortLabel: "Erase",
    icon: Eraser,
    hint: "Click on any drawn shape or pin to permanently delete it.",
  },
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
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [shapesCount, setShapesCount] = useState(0);

  // Sync shapes count from storage
  useEffect(() => {
    if (!isOpen) return;
    const updateCount = () => {
      setShapesCount(loadSavedShapes().length);
    };
    updateCount();
    window.addEventListener("delhi_shapes_changed", updateCount);
    return () => window.removeEventListener("delhi_shapes_changed", updateCount);
  }, [isOpen]);

  // Listen for reset events from map (e.g. when shape creation finishes)
  useEffect(() => {
    const handleReset = () => setActiveTool(null);
    window.addEventListener("delhi_draw_reset", handleReset);
    return () => window.removeEventListener("delhi_draw_reset", handleReset);
  }, []);

  if (!isOpen) return null;

  const handleToggleTool = (toolId: string) => {
    const next = activeTool === toolId ? null : toolId;
    setActiveTool(next);
    window.dispatchEvent(
      new CustomEvent("delhi_draw_tool_trigger", {
        detail: { mode: next || "none" },
      })
    );
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onChangeColor?.(color);
    window.dispatchEvent(
      new CustomEvent("delhi_draw_color_change", {
        detail: { color },
      })
    );
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
      setActiveTool(null);
      window.dispatchEvent(
        new CustomEvent("delhi_draw_tool_trigger", {
          detail: { mode: "none" },
        })
      );
    }
  };

  const handleClose = () => {
    setActiveTool(null);
    window.dispatchEvent(
      new CustomEvent("delhi_draw_tool_trigger", {
        detail: { mode: "none" },
      })
    );
    onClose();
  };

  // Find active tool details for guidance text
  const currentToolObj = DRAW_TOOLS.find((t) => t.id === activeTool);
  const activeHint = currentToolObj
    ? currentToolObj.hint
    : "Select a tool above (Area, Distance, Circle, Pin) to draw or measure on Delhi map.";

  return (
    <div className="fixed top-[115px] sm:top-24 left-1/2 -translate-x-1/2 z-40 w-[96vw] max-w-3xl bg-white/95 dark:bg-[#1e2023]/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.22)] border border-slate-200/90 dark:border-slate-700 p-2 sm:p-2.5 flex flex-col gap-2 text-xs select-none animate-in fade-in slide-in-from-top-2">
      {/* Top Row: Brand Badge, Drawing Tools, Colors, Actions */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {/* 1. Header / Mode Badge */}
        <div className="flex items-center gap-1.5 shrink-0 pr-1 border-r border-slate-200 dark:border-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
          <span className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1">
            <Shapes className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Draw Tools</span>
          </span>
        </div>

        {/* 2. Primary Drawing Tool Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {DRAW_TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                data-draw-tool={tool.id}
                onClick={() => handleToggleTool(tool.id)}
                title={tool.hint}
                aria-label={`Draw ${tool.label}`}
                className={`px-2 sm:px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/50 scale-[1.02]"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tool.label}</span>
                <span className="inline sm:hidden">{tool.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0 mx-0.5" />

        {/* 3. Color Palette Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
          <Palette className="w-3.5 h-3.5 text-slate-400 ml-0.5 mr-0.5 hidden sm:block" />
          {DRAW_COLORS.map((col) => (
            <button
              key={col.id}
              onClick={() => handleColorSelect(col.id)}
              title={`Color: ${col.name}`}
              className={`w-5 h-5 rounded-full ${col.bg} flex items-center justify-center transition-transform cursor-pointer ${
                selectedColor === col.id
                  ? "scale-110 ring-2 ring-white dark:ring-black shadow-xs"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              {selectedColor === col.id && (
                <Check className="w-3 h-3 text-white stroke-[3]" />
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0 mx-0.5" />

        {/* 4. Action Buttons: Import, Export, Clear, Close */}
        <div className="flex items-center gap-1 shrink-0">
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
            title="Import shapes from GeoJSON"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer shrink-0"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Import</span>
          </button>

          <button
            onClick={exportShapesToGeoJSON}
            title="Export shapes as standard GeoJSON file"
            className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 transition-colors shadow-xs active:scale-95 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            {shapesCount > 0 && (
              <span className="px-1 py-0.2 bg-blue-800/80 rounded-full text-[10px]">
                {shapesCount}
              </span>
            )}
          </button>

          <button
            onClick={handleClearAll}
            title="Clear all saved shapes"
            className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close Draw Tools"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Dynamic Guidance / Hint Banner */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5 min-w-0">
          {activeTool ? (
            <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 animate-ping" />
          ) : (
            <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          )}
          <span className="truncate font-medium">{activeHint}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(activeTool === "polygon" || activeTool === "line") && (
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("delhi_draw_tool_trigger", {
                    detail: { mode: "finish" },
                  })
                );
              }}
              className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer transition-colors"
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Complete Shape</span>
            </button>
          )}
          {shapesCount > 0 && (
            <span className="font-semibold text-slate-500 dark:text-slate-300 text-[10px]">
              {shapesCount} shape{shapesCount > 1 ? "s" : ""} on map
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
