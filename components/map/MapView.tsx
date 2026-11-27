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
import { DelhiMetroLayer } from "./DelhiMetroLayer";
import { MapRouteLayer } from "./MapRouteLayer";
import { GeomanDrawLayer } from "./GeomanDrawLayer";
import { ReverseGeocodingHandler } from "./ReverseGeocodingHandler";
import { NearbyMarkersLayer, NearbyPlaceItem } from "./NearbyMarkersLayer";
import { MetroStation } from "@/lib/metroData";
import { RouteData } from "@/types/routing";

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
  clusterMarkers?: MarkerPoi[];
  selectedClusterMarkerId?: string | null;
  onSelectClusterMarker?: (marker: MarkerPoi) => void;
  showMetroLines?: boolean;
  onSelectMetroStation?: (station: MetroStation) => void;
  onOpenShare?: (data: { title: string; url: string; description?: string }) => void;
  // Level 3 Additions:
  activeRoute?: RouteData | null;
  onClearRoute?: () => void;
  showDrawTools?: boolean;
  nearbyPlaces?: NearbyPlaceItem[];
  onSelectNearbyPlace?: (place: NearbyPlaceItem) => void;
  onRequestDirections?: (coords: [number, number], name: string) => void;
  onFindNearbyHere?: (coords: [number, number]) => void;
  onMapCenterChange?: (center: [number, number]) => void;
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
  showMetroLines = true,
  onSelectMetroStation,
  onOpenShare,
  activeRoute = null,
  onClearRoute,
  showDrawTools = false,
  nearbyPlaces = [],
  onSelectNearbyPlace,
  onRequestDirections,
  onFindNearbyHere,
  onMapCenterChange,
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
            onMapCenterChange?.(center);
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

        {/* Delhi Metro Network Overlay */}
        <DelhiMetroLayer
          visible={showMetroLines}
          onSelectStation={(station) => onSelectMetroStation?.(station)}
        />

        {/* Level 3: Geoman Drawing & Measurement Layer (Draw polygon, polyline, circle, marker; measure area/distance; persist to LocalStorage) */}
        <GeomanDrawLayer enabled={showDrawTools} />

        {/* Level 3: Reverse Geocoding Map Click Handler (Click map -> address popup with Navigate & Nearby) */}
        <ReverseGeocodingHandler
          enabled={!showDrawTools}
          onRequestDirections={onRequestDirections}
          onFindNearbyHere={onFindNearbyHere}
        />

        {/* Level 3: Overpass API Nearby POIs Layer (Café, ATM, Hospital, Restaurant, etc.) */}
        {nearbyPlaces && nearbyPlaces.length > 0 && (
          <NearbyMarkersLayer
            places={nearbyPlaces}
            onSelectPlace={(p) => onSelectNearbyPlace?.(p)}
            onRequestDirections={onRequestDirections}
          />
        )}

        {/* Level 3: Navigation Route Polyline Layer (OSRM Driving, Walking, Cycling) */}
        {activeRoute && (
          <MapRouteLayer
            route={activeRoute}
            onClearRoute={() => onClearRoute?.()}
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
          onOpenShare={onOpenShare}
        />
      </MapContainer>
    </div>
  );
}
