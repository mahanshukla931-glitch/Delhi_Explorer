"use client";

import React, { useState, useEffect } from "react";
import { MapContainer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  LayerType,
  LandmarkLocation,
  UserLocationState,
} from "@/types/map";
import { DistrictProperties, MarkerPoi } from "@/types/geojson";
import { NearbyPlaceItem } from "./NearbyMarkersLayer";
import { DELHI_DEFAULT_CENTER, DELHI_DEFAULT_ZOOM, DELHI_PRIMARY_LANDMARKS } from "@/lib/constants";
import { MapLayers } from "./MapLayers";
import { MapMarkers } from "./MapMarkers";
import { MapControlsOverlay } from "./MapControlsOverlay";
import { LocationMarker } from "./LocationMarker";
import dynamic from "next/dynamic";
import { MapEventsHandler } from "./MapEventsHandler";
import { DelhiDistrictsGeoJson } from "./DelhiDistrictsGeoJson";
import { MarkerClusterLayer } from "./MarkerClusterLayer";
import { DelhiMetroLayer } from "./DelhiMetroLayer";
import { TrafficLayer } from "./TrafficLayer";
import { ReverseGeocodingHandler } from "./ReverseGeocodingHandler";
import { MetroStation } from "@/lib/metroData";
import { RouteData } from "@/types/routing";

// Lazy-load heavy optional plugins so initial map bundle stays ultra-light
const GeomanDrawLayer = dynamic(
  () => import("./GeomanDrawLayer").then((m) => m.GeomanDrawLayer),
  { ssr: false }
);
const LeafletHeatLayer = dynamic(
  () => import("./LeafletHeatLayer").then((m) => m.LeafletHeatLayer),
  { ssr: false }
);
const MapRouteLayer = dynamic(
  () => import("./MapRouteLayer").then((m) => m.MapRouteLayer),
  { ssr: false }
);
const NearbyMarkersLayer = dynamic(
  () => import("./NearbyMarkersLayer").then((m) => m.NearbyMarkersLayer),
  { ssr: false }
);

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
  activeChoroplethMetric?: "density" | "population" | "literacyRate" | "areaKm2";
  onSelectDistrict?: (props: DistrictProperties | null) => void;
  showMarkerClusters?: boolean;
  showHeatmap?: boolean;
  clusterMarkers?: MarkerPoi[];
  selectedClusterMarkerId?: string | null;
  onSelectClusterMarker?: (marker: MarkerPoi) => void;
  showMetroLines?: boolean;
  showTraffic?: boolean;
  onSelectMetroStation?: (station: MetroStation) => void;
  onOpenShare?: (data: { title: string; url: string; description?: string }) => void;
  // Level 3 Additions:
  activeRoute?: RouteData | null;
  onClearRoute?: () => void;
  showDrawTools?: boolean;
  activeDrawColor?: string;
  nearbyPlaces?: NearbyPlaceItem[];
  onSelectNearbyPlace?: (place: NearbyPlaceItem) => void;
  onRequestDirections?: (coords: [number, number], name: string) => void;
  onFindNearbyHere?: (coords: [number, number]) => void;
  onMapCenterChange?: (center: [number, number]) => void;
  // Live Navigation Simulation Props:
  isNavSimActive?: boolean;
  navSimPosition?: [number, number] | null;
  navSimBearing?: number;
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
  showHeatmap = false,
  clusterMarkers = [],
  selectedClusterMarkerId = null,
  onSelectClusterMarker,
  showMetroLines = true,
  showTraffic = true,
  onSelectMetroStation,
  onOpenShare,
  activeRoute = null,
  onClearRoute,
  showDrawTools = false,
  activeDrawColor = "#3b82f6",
  nearbyPlaces = [],
  onSelectNearbyPlace,
  onRequestDirections,
  onFindNearbyHere,
  onMapCenterChange,
  isNavSimActive = false,
  navSimPosition = null,
  navSimBearing = 0,
}: MapViewProps) {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [centerCoords, setCenterCoords] = useState<[number, number]>(DELHI_DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(DELHI_DEFAULT_ZOOM);
  const [cursorCoords, setCursorCoords] = useState<[number, number] | null>(null);

  // Standard landmark or place jump
  useEffect(() => {
    if (mapInstance && flyToLocation && !isNavSimActive) {
      mapInstance.flyTo(flyToLocation, 15, {
        duration: 1.4,
        easeLinearity: 0.25,
      });
    }
  }, [flyToLocation, mapInstance, isNavSimActive]);

  // Google Maps Style Live Navigation Tracking (Smooth camera pan)
  useEffect(() => {
    if (mapInstance && isNavSimActive && navSimPosition) {
      mapInstance.panTo(navSimPosition, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [navSimPosition, isNavSimActive, mapInstance]);

  // Clean navigation view: declutter heavy background layers while user is navigating
  const effectiveShowDistricts = showDistricts && !isNavSimActive;
  const effectiveShowClusters = showMarkerClusters && !isNavSimActive && !showHeatmap;

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
            onMapCenterChange?.(center);

            // Level 4: Seamlessly sync map state to browser URL without re-rendering or page reload
            if (typeof window !== "undefined" && window.history?.replaceState && !isNavSimActive) {
              const url = new URL(window.location.href);
              url.searchParams.set("lat", center[0].toFixed(4));
              url.searchParams.set("lng", center[1].toFixed(4));
              url.searchParams.set("z", zoom.toString());
              url.searchParams.set("layer", activeLayer);
              window.history.replaceState({}, "", url.toString());
            }
          }}
          onMouseMove={(coords) => {
            setCursorCoords(coords);
          }}
        />

        {/* Level 2: Delhi 11 Districts GeoJSON Choropleth Layer */}
        {effectiveShowDistricts && (
          <DelhiDistrictsGeoJson
            visible={effectiveShowDistricts}
            activeMetric={activeChoroplethMetric}
            onSelectDistrict={(props) => onSelectDistrict?.(props)}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Delhi Metro Network Overlay */}
        <DelhiMetroLayer
          visible={showMetroLines}
          onSelectStation={(station) => onSelectMetroStation?.(station)}
        />

        {/* Live Delhi Traffic Overlay */}
        <TrafficLayer visible={showTraffic} />

        {/* Level 3: Geoman Drawing & Measurement Layer */}
        {showDrawTools && !isNavSimActive && (
          <GeomanDrawLayer enabled={showDrawTools && !isNavSimActive} activeColor={activeDrawColor} />
        )}

        {/* Level 3: Reverse Geocoding Map Click Handler */}
        <ReverseGeocodingHandler
          enabled={!showDrawTools && !isNavSimActive}
          onRequestDirections={onRequestDirections}
          onFindNearbyHere={onFindNearbyHere}
        />

        {/* Level 3: Overpass API Nearby POIs Layer */}
        {nearbyPlaces && nearbyPlaces.length > 0 && !isNavSimActive && (
          <NearbyMarkersLayer
            places={nearbyPlaces}
            onSelectPlace={(p) => onSelectNearbyPlace?.(p)}
            onRequestDirections={onRequestDirections}
          />
        )}

        {/* Level 3: Navigation Route Polyline Layer with Live Vehicle Puck */}
        {activeRoute && (
          <MapRouteLayer
            route={activeRoute}
            onClearRoute={() => onClearRoute?.()}
            navPosition={isNavSimActive ? navSimPosition : null}
            navBearing={navSimBearing}
          />
        )}

        {/* Level 4: Heatmap Density Layer (leaflet.heat) */}
        {showHeatmap && !isNavSimActive && clusterMarkers && clusterMarkers.length > 0 && (
          <LeafletHeatLayer markers={clusterMarkers} visible={showHeatmap} />
        )}

        {/* Level 2: 1,200+ Marker Clustering Layer */}
        {effectiveShowClusters && clusterMarkers && clusterMarkers.length > 0 && (
          <MarkerClusterLayer
            markers={clusterMarkers}
            selectedMarkerId={selectedClusterMarkerId}
            onSelectMarker={(marker) => onSelectClusterMarker?.(marker)}
          />
        )}

        {/* Primary Landmarks (when clustering is toggled off or as fallback) */}
        {!effectiveShowClusters && !isNavSimActive && (
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
          onOpenShare={onOpenShare}
        />
      </MapContainer>
    </div>
  );
}
