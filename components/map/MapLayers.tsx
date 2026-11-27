"use client";

import React from "react";
import { TileLayer } from "react-leaflet";
import { MAP_LAYERS } from "@/lib/constants";
import { LayerType } from "@/types/map";

interface MapLayersProps {
  activeLayer: LayerType;
  isDarkMode?: boolean;
}

export function MapLayers({ activeLayer, isDarkMode = false }: MapLayersProps) {
  // Determine tile config and styling based on active layer and Night Mode status
  let tileUrl: string;
  let attribution: string;
  let maxZoom: number;
  let tileClass = "";
  let showDarkOverlayLabels = false;

  if (activeLayer === "satellite") {
    tileUrl = MAP_LAYERS.satellite.url;
    attribution = MAP_LAYERS.satellite.attribution;
    maxZoom = MAP_LAYERS.satellite.maxZoom || 18;
    tileClass = isDarkMode ? "dark-satellite-tile" : "";
  } else if (activeLayer === "terrain") {
    tileUrl = MAP_LAYERS.terrain.url;
    attribution = MAP_LAYERS.terrain.attribution;
    maxZoom = MAP_LAYERS.terrain.maxZoom || 18;
    tileClass = isDarkMode ? "dark-terrain-tile" : "";
    showDarkOverlayLabels = isDarkMode;
  } else {
    // Street ("osm") or explicit "dark"
    if (isDarkMode || activeLayer === "dark") {
      tileUrl = MAP_LAYERS.dark.url;
      attribution = MAP_LAYERS.dark.attribution;
      maxZoom = MAP_LAYERS.dark.maxZoom || 16;
      tileClass = "night-mode-tile";
      showDarkOverlayLabels = true;
    } else {
      tileUrl = MAP_LAYERS.osm.url;
      attribution = MAP_LAYERS.osm.attribution;
      maxZoom = MAP_LAYERS.osm.maxZoom || 19;
      tileClass = "";
      showDarkOverlayLabels = false;
    }
  }

  // Use a composite key so that Leaflet cleanly re-mounts and swaps tiles when theme or layer changes
  const layerKey = `${activeLayer}-${isDarkMode ? "dark" : "light"}`;

  return (
    <>
      <TileLayer
        key={layerKey}
        url={tileUrl}
        attribution={attribution}
        maxZoom={maxZoom}
        className={tileClass}
      />

      {/* When Night Mode is active on Street or Terrain, overlay high-contrast roads & landmark labels */}
      {showDarkOverlayLabels && (
        <TileLayer
          key={`${layerKey}-labels`}
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri Labels"
          maxZoom={16}
          opacity={0.95}
          zIndex={500}
        />
      )}
    </>
  );
}
