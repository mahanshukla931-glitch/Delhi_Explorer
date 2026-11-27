"use client";

import React from "react";
import { Polyline, CircleMarker, Popup, Tooltip } from "react-leaflet";
import { DELHI_METRO_LINES, MetroStation } from "@/lib/metroData";
import { Train, ArrowRightLeft, Navigation } from "lucide-react";

interface DelhiMetroLayerProps {
  visible: boolean;
  onSelectStation?: (station: MetroStation) => void;
}

export function DelhiMetroLayer({ visible, onSelectStation }: DelhiMetroLayerProps) {
  if (!visible) return null;

  return (
    <>
      {DELHI_METRO_LINES.map((line) => (
        <React.Fragment key={line.id}>
          {/* Subtle Outer Glow Polyline for High Contrast on both OSM and Satellite */}
          <Polyline
            positions={line.routeCoordinates}
            pathOptions={{
              color: "#000000",
              weight: 6.5,
              opacity: 0.45,
              lineCap: "round",
              lineJoin: "round",
            }}
          />

          {/* Main Vibrant Colored Transit Line */}
          <Polyline
            positions={line.routeCoordinates}
            pathOptions={{
              color: line.color,
              weight: 4.5,
              opacity: 0.95,
              lineCap: "round",
              lineJoin: "round",
            }}
          >
            <Tooltip sticky direction="top" opacity={0.9}>
              <div className="font-bold text-xs flex items-center gap-1.5 px-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: line.color }}
                />
                <span>{line.name}</span>
              </div>
            </Tooltip>
          </Polyline>

          {/* Station Markers */}
          {line.stations.map((station) => {
            const isInterchange = station.isInterchange;
            return (
              <CircleMarker
                key={station.id}
                center={station.coordinates}
                radius={isInterchange ? 6.5 : 4.5}
                pathOptions={{
                  fillColor: isInterchange ? "#ffffff" : line.color,
                  fillOpacity: 1,
                  color: isInterchange ? line.color : "#ffffff",
                  weight: isInterchange ? 3 : 1.8,
                }}
                eventHandlers={{
                  click: () => {
                    if (onSelectStation) onSelectStation(station);
                  },
                }}
              >
                {/* Station Hover Tooltip */}
                <Tooltip direction="top" offset={[0, -8]} opacity={0.96}>
                  <div className="font-bold text-xs flex items-center gap-1.5 px-0.5 text-slate-900">
                    <Train className="w-3.5 h-3.5 text-blue-600" />
                    <span>{station.name}</span>
                    {isInterchange && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-extrabold uppercase">
                        Interchange
                      </span>
                    )}
                  </div>
                </Tooltip>

                {/* Station Info Popup */}
                <Popup className="custom-leaflet-popup" maxWidth={280}>
                  <div className="p-1 font-sans text-slate-800">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: line.color }}
                      >
                        <Train className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 leading-tight truncate">
                          {station.name}
                        </h4>
                        <div className="text-[10.5px] font-semibold text-slate-500">
                          {station.hindiName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-bold mb-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: line.color }}
                      />
                      <span>{station.line}</span>
                    </div>

                    {isInterchange && station.interchanges && (
                      <div className="bg-amber-50 rounded-xl p-2 border border-amber-200/80 mb-2">
                        <div className="text-[10px] uppercase font-extrabold text-amber-800 flex items-center gap-1 mb-1">
                          <ArrowRightLeft className="w-3 h-3 text-amber-600" />
                          <span>Interchange Lines</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {station.interchanges.map((ic, idx) => (
                            <span
                              key={idx}
                              className="text-[9.5px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-amber-200 shadow-2xs"
                            >
                              {ic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-100">
                      <span>
                        {station.coordinates[0].toFixed(4)}°N, {station.coordinates[1].toFixed(4)}°E
                      </span>
                      <button
                        onClick={() => {
                          if (onSelectStation) onSelectStation(station);
                        }}
                        className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 text-[11px]"
                      >
                        <span>Focus</span>
                        <Navigation className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </React.Fragment>
      ))}
    </>
  );
}
