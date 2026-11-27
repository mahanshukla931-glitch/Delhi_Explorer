"use client";

import React, { useMemo } from "react";
import { Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { UserLocationState } from "@/types/map";

interface LocationMarkerProps {
  userLocation: UserLocationState;
}

export function LocationMarker({ userLocation }: LocationMarkerProps) {
  const userIcon = useMemo(() => {
    const svgHtml = `
      <div style="position: relative; width: 20px; height: 20px;">
        <span style="position: absolute; inset: 0; border-radius: 9999px; background-color: #3b82f6; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; width: 20px; height: 20px; border-radius: 9999px; background-color: #2563eb; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);"></div>
      </div>
    `;

    return L.divIcon({
      html: svgHtml,
      className: "user-loc-pulsing-icon",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, []);

  if (!userLocation.coords) return null;

  return (
    <>
      <Marker position={userLocation.coords} icon={userIcon}>
        <Popup>
          <div className="text-xs p-1">
            <p className="font-bold text-blue-600 mb-1">📍 You Are Here</p>
            <p className="text-slate-600">
              Coordinates: {userLocation.coords[0].toFixed(5)},{" "}
              {userLocation.coords[1].toFixed(5)}
            </p>
            {userLocation.accuracy && (
              <p className="text-[10px] text-slate-500 mt-1">
                Accuracy: ±{Math.round(userLocation.accuracy)} meters
              </p>
            )}
          </div>
        </Popup>
      </Marker>
      {userLocation.accuracy && (
        <Circle
          center={userLocation.coords}
          radius={userLocation.accuracy}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.15,
            weight: 1.5,
          }}
        />
      )}
    </>
  );
}
