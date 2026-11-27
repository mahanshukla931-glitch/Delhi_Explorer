"use client";

import React, { useState, useEffect } from "react";
import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { LandmarkLocation } from "@/types/map";
import { isLandmarkSaved, toggleLandmarkSaved } from "@/lib/bookmarks";
import { Bookmark, Star, Train, Navigation } from "lucide-react";

interface MapMarkersProps {
  landmarks: LandmarkLocation[];
  selectedLandmarkId: string | null;
  onSelectLandmark: (landmark: LandmarkLocation) => void;
}

export function MapMarkers({
  landmarks,
  selectedLandmarkId,
  onSelectLandmark,
}: MapMarkersProps) {
  const [, setBookmarkRevision] = useState(0);

  // Re-render when bookmarks are toggled anywhere
  useEffect(() => {
    const handleBookmarkChange = () => setBookmarkRevision((r) => r + 1);
    window.addEventListener("delhi_bookmarks_changed", handleBookmarkChange);
    return () => window.removeEventListener("delhi_bookmarks_changed", handleBookmarkChange);
  }, []);

  // Google Maps Signature Dropdown Pin (Red marker with white center dot & drop shadow)
  const createGoogleMapsPin = (category: string, isSelected: boolean) => {
    const pinColor =
      category === "monument"
        ? "#ea4335" // Google Maps Red
        : category === "heritage"
        ? "#f29900" // Google Maps Amber
        : category === "religious"
        ? "#1a73e8" // Google Maps Blue
        : "#1e8e3e"; // Google Maps Green

    const width = isSelected ? 34 : 28;
    const height = isSelected ? 44 : 38;

    const svgHtml = `
      <div style="position: relative; width: ${width}px; height: ${height}px; transform: translate(-50%, -100%); cursor: pointer;">
        <svg viewBox="0 0 24 34" width="${width}" height="${height}" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.4));">
          <!-- Pin body -->
          <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 22 12 22s12-13 12-22c0-6.63-5.37-12-12-12z" fill="${pinColor}" stroke="#ffffff" stroke-width="1.2"/>
          <!-- Inner circle -->
          <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
          <circle cx="12" cy="11" r="2.2" fill="${pinColor}"/>
        </svg>
        ${
          isSelected
            ? `<div style="position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; border-radius: 9999px; background-color: #ea4335; box-shadow: 0 0 8px #ea4335; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ""
        }
      </div>
    `;

    return L.divIcon({
      html: svgHtml,
      className: "google-maps-pin",
      iconSize: [width, height],
      iconAnchor: [width / 2, height],
      popupAnchor: [0, -height],
    });
  };

  return (
    <>
      {landmarks.map((loc) => {
        const isSelected = selectedLandmarkId === loc.id;
        const icon = createGoogleMapsPin(loc.category, isSelected);
        const saved = isLandmarkSaved(loc.id);

        return (
          <Marker
            key={loc.id}
            position={loc.coordinates}
            icon={icon}
            eventHandlers={{
              click: () => onSelectLandmark(loc),
            }}
          >
            {/* Google Maps Clean Hover Label */}
            <Tooltip direction="top" offset={[0, -36]} opacity={0.96}>
              <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5 px-0.5">
                <span>{loc.name}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  • {loc.category}
                </span>
              </div>
            </Tooltip>

            {/* Google Maps Clean Info Window Popup with Real HD Photo & Bookmark */}
            <Popup className="google-maps-popup" maxWidth={310} minWidth={250}>
              <div className="p-1 text-slate-800">
                {/* Real HD Photo Card Banner */}
                {loc.imageUrl && (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden mb-2 shadow-xs group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={loc.imageUrl}
                      alt={loc.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Rating badge overlay */}
                    {loc.rating && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300 border border-white/20">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{loc.rating}</span>
                      </div>
                    )}

                    {/* Category pill */}
                    <span className="absolute top-2 left-2 text-[9px] uppercase px-2 py-0.5 rounded-full font-bold bg-white/90 text-slate-800 shadow-sm backdrop-blur-xs">
                      {loc.category}
                    </span>

                    {/* Bookmark Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLandmarkSaved(loc.id);
                      }}
                      title={saved ? "Remove from Saved" : "Save to Favorites"}
                      className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md ${
                        saved
                          ? "bg-amber-500 text-white"
                          : "bg-white/90 text-slate-700 hover:bg-white hover:text-amber-500"
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-white" : ""}`} />
                    </button>
                  </div>
                )}

                <div className="flex items-start justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                  <div>
                    <h3 className="text-sm font-bold leading-tight text-slate-900">
                      {loc.name}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-2 leading-relaxed line-clamp-2">
                  {loc.description}
                </p>

                {loc.metroStation && (
                  <p className="text-[11px] text-blue-600 font-semibold mb-2 flex items-center gap-1">
                    <Train className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{loc.metroStation}</span>
                  </p>
                )}

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px]">
                  <div className="text-slate-400 font-mono">
                    <span>{loc.coordinates[0].toFixed(4)}°N, </span>
                    <span>{loc.coordinates[1].toFixed(4)}°E</span>
                  </div>

                  <button
                    onClick={() => onSelectLandmark(loc)}
                    className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 text-[11px]"
                  >
                    <span>Details</span>
                    <Navigation className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
