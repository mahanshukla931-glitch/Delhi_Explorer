"use client";

import React, { useEffect, useState } from "react";
import { Polyline, Tooltip } from "react-leaflet";
import { getLiveDelhiTraffic, TrafficCorridor } from "@/lib/trafficData";

interface TrafficLayerProps {
  visible: boolean;
}

export function TrafficLayer({ visible }: TrafficLayerProps) {
  const [corridors, setCorridors] = useState<TrafficCorridor[]>([]);

  useEffect(() => {
    if (!visible) return;
    setCorridors(getLiveDelhiTraffic());

    // Refresh traffic every 60 seconds
    const interval = setInterval(() => {
      setCorridors(getLiveDelhiTraffic());
    }, 60000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {corridors.map((c) => (
        <React.Fragment key={c.id}>
          {/* Casing / Shadow */}
          <Polyline
            positions={c.coordinates}
            pathOptions={{
              color: "#000000",
              weight: 6,
              opacity: 0.25,
              lineCap: "round",
              lineJoin: "round",
            }}
          />

          {/* Traffic Flow Line */}
          <Polyline
            positions={c.coordinates}
            pathOptions={{
              color: c.color,
              weight: 4.5,
              opacity: 0.9,
              dashArray: c.level === "heavy" ? "8, 6" : undefined,
              lineCap: "round",
              lineJoin: "round",
            }}
          >
            <Tooltip sticky className="custom-leaflet-popup">
              <div className="font-sans text-xs">
                <div className="font-extrabold text-slate-900 dark:text-white">
                  {c.name}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      c.level === "heavy"
                        ? "bg-red-500"
                        : c.level === "moderate"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">
                    {c.level} Traffic ({c.speedKmh} km/h)
                  </span>
                </div>
                {c.delayMins > 0 && (
                  <div className="text-[10px] text-rose-500 font-semibold mt-0.5">
                    +{c.delayMins} min congestion delay
                  </div>
                )}
              </div>
            </Tooltip>
          </Polyline>
        </React.Fragment>
      ))}
    </>
  );
}
