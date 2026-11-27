"use client";

import React, { useState, useEffect } from "react";
import { useMap } from "react-leaflet";
import {
  Crosshair,
  Loader2,
  Plus,
  Minus,
  Compass,
  Maximize2,
  Minimize2,
  Share2,
  Check,
} from "lucide-react";
import { LayerType, UserLocationState } from "@/types/map";
import { MAP_LAYERS, DELHI_DEFAULT_CENTER, DELHI_DEFAULT_ZOOM } from "@/lib/constants";

interface MapControlsOverlayProps {
  activeLayer: LayerType;
  onChangeLayer: (layer: LayerType) => void;
  userLocation: UserLocationState;
  onLocateUser: () => void;
  mapZoom: number;
  centerCoords: [number, number];
  cursorCoords?: [number, number] | null;
  onOpenShare?: (data: { title: string; url: string; description?: string }) => void;
}

export function MapControlsOverlay({
  activeLayer,
  onChangeLayer,
  userLocation,
  onLocateUser,
  mapZoom,
  centerCoords,
  cursorCoords,
  onOpenShare,
}: MapControlsOverlayProps) {
  const map = useMap();
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleResetDelhi = () => {
    map.flyTo(DELHI_DEFAULT_CENTER, DELHI_DEFAULT_ZOOM, { duration: 1.2 });
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn("Exit fullscreen error:", err);
        });
      }
    }
  };

  const handleShareView = () => {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${centerCoords[0].toFixed(4)}&lng=${centerCoords[1].toFixed(4)}&z=${mapZoom}&layer=${activeLayer}`;

    if (onOpenShare) {
      onOpenShare({
        title: "Delhi Explorer Live Map View",
        url: shareUrl,
        description: `Coordinates: ${centerCoords[0].toFixed(4)}°N, ${centerCoords[1].toFixed(4)}°E (Zoom: ${mapZoom})`,
      });
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2600);
        })
        .catch(() => {
          prompt("Copy map share link:", shareUrl);
        });
    } else {
      prompt("Copy map share link:", shareUrl);
    }
  };

  return (
    <>
      {/* Bottom-Left: Google Maps Style Layer Switcher Floating Button */}
      <div
        className="leaflet-bottom leaflet-left"
        style={{ pointerEvents: "auto", margin: "16px", zIndex: 1000 }}
      >
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu((prev) => !prev)}
            aria-label="Layers"
            className="group flex items-center gap-2 bg-white dark:bg-[#202124] hover:bg-slate-50 dark:hover:bg-[#2d2e30] border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-1.5 pr-3 shadow-[0_2px_6px_rgba(60,64,67,0.3)] transition-all active:scale-95"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
              {activeLayer === "satellite" ? "🛰️" : activeLayer === "terrain" ? "🏔️" : "🗺️"}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] uppercase font-bold text-slate-400">Layer</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 capitalize">
                {activeLayer === "osm" ? "Street" : activeLayer}
              </div>
            </div>
          </button>

          {/* Quick Layer Switcher Flyout */}
          {showLayerMenu && (
            <div className="absolute left-0 bottom-14 w-52 bg-white dark:bg-[#202124] rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.25)] border border-slate-200/80 dark:border-slate-700/60 p-2 z-[1000] animate-in slide-in-from-bottom-2 fade-in">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 mb-1">
                Map Types
              </div>
              <div className="flex flex-col gap-1">
                {Object.values(MAP_LAYERS)
                  .filter((layer) => layer.id !== "dark")
                  .map((layer) => {
                    const isSelected = activeLayer === layer.id;
                    return (
                      <button
                        key={layer.id}
                        onClick={() => {
                          onChangeLayer(layer.id as LayerType);
                          setShowLayerMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{layer.name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom-Right: Google Maps Style Floating Action Controls */}
      <div
        className="leaflet-bottom leaflet-right"
        style={{ pointerEvents: "auto", margin: "16px", zIndex: 1000 }}
      >
        <div className="flex flex-col items-center gap-2">
          {/* 1-Click Share View URL Button */}
          <button
            onClick={handleShareView}
            title={isCopied ? "Link Copied!" : "Share Map View"}
            aria-label="Share Map View"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#202124] border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-[0_2px_6px_rgba(60,64,67,0.3)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 group relative"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in" />
            ) : (
              <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
            aria-label="Fullscreen"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#202124] border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-[0_2px_6px_rgba(60,64,67,0.3)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            )}
          </button>

          {/* Compass / Recenter Delhi */}
          <button
            onClick={handleResetDelhi}
            title="Recenter to Central Delhi"
            aria-label="Recenter Delhi"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#202124] border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-[0_2px_6px_rgba(60,64,67,0.3)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <Compass className="w-5 h-5 text-rose-500" />
          </button>

          {/* Locate Me (GPS) Button */}
          <button
            onClick={onLocateUser}
            disabled={userLocation.loading}
            title="Your Location"
            aria-label="Locate me"
            className="w-10 h-10 rounded-full bg-white dark:bg-[#202124] border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-[0_2px_6px_rgba(60,64,67,0.3)] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {userLocation.loading ? (
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            ) : (
              <Crosshair className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </button>

          {/* Google Maps Style Clean Pill Zoom Controls (+ / -) */}
          <div className="flex flex-col bg-white dark:bg-[#202124] rounded-full border border-slate-200/80 dark:border-slate-700/60 shadow-[0_2px_6px_rgba(60,64,67,0.3)] overflow-hidden">
            <button
              onClick={() => map.zoomIn()}
              title="Zoom in"
              className="w-10 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-700"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => map.zoomOut()}
              title="Zoom out"
              className="w-10 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Share Toast Notification */}
      {isCopied && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900/95 dark:bg-[#1a1a1a]/95 text-white backdrop-blur-md px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex items-center gap-2.5 text-xs font-semibold border border-slate-700/80 animate-in fade-in slide-in-from-bottom-3 duration-200"
          style={{ pointerEvents: "none" }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Map view link copied with live coords & zoom!</span>
        </div>
      )}

      {/* Subtle Google Maps Style Bottom Status Metric strip (Desktop only) */}
      <div
        className="leaflet-bottom hidden sm:block"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: "12px",
          pointerEvents: "none",
          zIndex: 900,
        }}
      >
        <div className="bg-white/85 dark:bg-[#202124]/85 backdrop-blur-md px-3.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-2.5 text-[10px] font-mono text-slate-700 dark:text-slate-200">
          <span>
            {cursorCoords
              ? `Cursor: ${cursorCoords[0].toFixed(4)}°N, ${cursorCoords[1].toFixed(4)}°E`
              : `Center: ${centerCoords[0].toFixed(4)}°N, ${centerCoords[1].toFixed(4)}°E`}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-400" />
          <span className="font-semibold text-blue-600 dark:text-blue-400">Zoom: {mapZoom}</span>
        </div>
      </div>
    </>
  );
}
