"use client";

import React, { useEffect, useState } from "react";
import { MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";

import {
  DELHI_DEFAULT_CENTER,
  DELHI_DEFAULT_ZOOM,
  DELHI_PRIMARY_LANDMARKS,
} from "@/lib/constants";
import { LayerType, LandmarkLocation, UserLocationState } from "@/types/map";
import { DistrictProperties, MarkerPoi } from "@/types/geojson";
import { MapLayers } from "./MapLayers";
import { MapMarkers } from "./MapMarkers";
import { LocationMarker } from "./LocationMarker";
import { MapControlsOverlay } from "./MapControlsOverlay";
import { MapEventsHandler } from "./MapEventsHandler";
import { DelhiDistrictsGeoJson } from "./DelhiDistrictsGeoJson";
import { MarkerClusterLayer } from "./MarkerClusterLayer";

// Fix default Leaflet marker icon asset paths
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

if (typeof window !== "undefined") {
  (window as unknown as { L: typeof L }).L = L;
}

interface MapViewProps {
  activeLayer: LayerType;
  onChangeLayer: (layer: LayerType) => void;
  selectedLandmark: LandmarkLocation | null;
  onSelectLandmark: (landmark: LandmarkLocation | null) => void;
  flyToLocation: [number, number] | null;
  userLocation: UserLocationState;
  onLocateUser: () => void;
  isDarkMode?: boolean;
  // Level 2 Additions:
  showDistricts?: boolean;
  activeChoroplethMetric?: "density" | "population" | "literacyRate";
  onSelectDistrict?: (props: DistrictProperties | null) => void;
  showMarkerClusters?: boolean;
  clusterMarkers?: MarkerPoi[];
  selectedClusterMarkerId?: string | null;
  onSelectClusterMarker?: (marker: MarkerPoi) => void;
}

export default function MapView({
  activeLayer,
  onChangeLayer,
  selectedLandmark,
  onSelectLandmark,
  flyToLocation,
  userLocation,
  onLocateUser,
  isDarkMode = false,
  showDistricts = true,
  activeChoroplethMetric = "density",
  onSelectDistrict,
  showMarkerClusters = true,
  clusterMarkers = [],
  selectedClusterMarkerId = null,
  onSelectClusterMarker,
}: MapViewProps) {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [centerCoords, setCenterCoords] = useState<[number, number]>(DELHI_DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(DELHI_DEFAULT_ZOOM);
  const [cursorCoords, setCursorCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (mapInstance && flyToLocation) {
      mapInstance.flyTo(flyToLocation, 15, {
        duration: 1.4,
        easeLinearity: 0.25,
      });
    }
  }, [flyToLocation, mapInstance]);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-slate-100 dark:bg-[#1a1a1a]">
      <MapContainer
        center={DELHI_DEFAULT_CENTER}
        zoom={DELHI_DEFAULT_ZOOM}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        ref={(ref) => {
          if (ref) setMapInstance(ref);
        }}
      >
        <MapLayers activeLayer={activeLayer} isDarkMode={isDarkMode} />

        <MapEventsHandler
          onMoveEnd={(center, zoom) => {
            setCenterCoords(center);
            setMapZoom(zoom);
          }}
          onMouseMove={(coords) => {
            setCursorCoords(coords);
          }}
        />

        {/* Level 2: Delhi 11 Districts GeoJSON Choropleth Layer */}
        {showDistricts && (
          <DelhiDistrictsGeoJson
            visible={showDistricts}
            activeMetric={activeChoroplethMetric}
            onSelectDistrict={(props) => onSelectDistrict?.(props)}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Level 2: 1,200+ Marker Clustering Layer */}
        {showMarkerClusters && clusterMarkers && clusterMarkers.length > 0 && (
          <MarkerClusterLayer
            markers={clusterMarkers}
            selectedMarkerId={selectedClusterMarkerId}
            onSelectMarker={(marker) => onSelectClusterMarker?.(marker)}
          />
        )}

        {/* Primary Landmarks (when clustering is toggled off or as fallback) */}
        {!showMarkerClusters && (
          <MapMarkers
            landmarks={DELHI_PRIMARY_LANDMARKS}
            selectedLandmarkId={selectedLandmark?.id || null}
            onSelectLandmark={(landmark) => onSelectLandmark(landmark)}
          />
        )}

        {/* Geolocation Marker */}
        <LocationMarker userLocation={userLocation} />

        {/* Floating Google Maps Style Controls */}
        <MapControlsOverlay
          activeLayer={activeLayer}
          onChangeLayer={onChangeLayer}
          userLocation={userLocation}
          onLocateUser={onLocateUser}
          mapZoom={mapZoom}
          centerCoords={centerCoords}
          cursorCoords={cursorCoords}
        />
      </MapContainer>
    </div>
  );
}
