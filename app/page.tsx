"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { GoogleMapsSearchCard } from "@/components/ui/GoogleMapsSearchCard";
import { GoogleMapsDrawer } from "@/components/ui/GoogleMapsDrawer";
import { AskMapsModal } from "@/components/ui/AskMapsModal";
import { DelhiWeatherWidget } from "@/components/ui/DelhiWeatherWidget";
import { MapLoadingSkeleton } from "@/components/ui/MapLoadingSkeleton";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChoroplethLegend } from "@/components/ui/ChoroplethLegend";
import { LayerType, LandmarkLocation, UserLocationState } from "@/types/map";
import { DistrictProperties, MarkerPoi } from "@/types/geojson";
import { DELHI_PRIMARY_LANDMARKS } from "@/lib/constants";

// Client-only dynamic import of MapView to avoid SSR issues
const DynamicMapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

export default function Home() {
  const [activeLayer, setActiveLayer] = useState<LayerType>("osm");
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkLocation | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAskMapsOpen, setIsAskMapsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Level 2 State: 1,200 Marker API & Places Explorer
  const [allMarkers, setAllMarkers] = useState<MarkerPoi[]>([]);
  const [filteredMarkers, setFilteredMarkers] = useState<MarkerPoi[]>([]);
  const [selectedClusterMarker, setSelectedClusterMarker] = useState<MarkerPoi | null>(null);
  const [showMarkerClusters, setShowMarkerClusters] = useState(true);
  const [isPlacesExplorerOpen, setIsPlacesExplorerOpen] = useState(false);
  const [sidebarCategory, setSidebarCategory] = useState("all");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Level 2 State: Delhi 11 Districts GeoJSON & Choropleth
  const [showDistrictsGeoJson, setShowDistrictsGeoJson] = useState(true);
  const [activeChoroplethMetric, setActiveChoroplethMetric] = useState<
    "density" | "population" | "literacyRate"
  >("density");
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictProperties | null>(null);

  // Dynamic Weather Location (Updates on GPS detect & when user searches any place in India like Mumbai/Kurla)
  const [weatherLocation, setWeatherLocation] = useState<{
    coords: [number, number];
    name: string;
  }>({
    coords: [28.6139, 77.209],
    name: "Delhi",
  });

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<UserLocationState>({
    coords: null,
    accuracy: null,
    loading: false,
    error: null,
  });

  // Level 2: Fetch 1,200+ Marker records from typed Next.js API route (/api/markers)
  useEffect(() => {
    fetch("/api/markers")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load markers");
        return res.json();
      })
      .then((data) => {
        if (data && data.markers) {
          setAllMarkers(data.markers);
          setFilteredMarkers(data.markers);
          const counts: Record<string, number> = {};
          if (data.categories) {
            data.categories.forEach((c: { id: string; count: number }) => {
              counts[c.id] = c.count;
            });
          }
          setCategoryCounts(counts);
        }
      })
      .catch((err) => {
        console.error("Markers API error:", err);
      });
  }, []);

  // Level 2: Bi-directional filtering on Category and Search Query
  useEffect(() => {
    let result = allMarkers;
    if (sidebarCategory !== "all") {
      result = result.filter((m) => m.category === sidebarCategory);
    }
    if (sidebarSearch.trim()) {
      const q = sidebarSearch.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.hub?.toLowerCase().includes(q) ||
          m.address?.toLowerCase().includes(q)
      );
    }
    setFilteredMarkers(result);
  }, [allMarkers, sidebarCategory, sidebarSearch]);

  // Auto-detect user GPS on initial load
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation({
            coords,
            accuracy: pos.coords.accuracy,
            loading: false,
            error: null,
          });

          // Instantly fly map to user's real live GPS location
          setFlyToCoords(coords);

          // Reverse geocode via OpenStreetMap to detect user's live city name
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`
            );
            if (res.ok) {
              const data = await res.json();
              const detectedCity =
                data.address?.city ||
                data.address?.town ||
                data.address?.suburb ||
                data.address?.state_district ||
                data.address?.state ||
                "My Location";

              setWeatherLocation({
                coords,
                name: detectedCity,
              });
              return;
            }
          } catch {
            // fallback
          }

          setWeatherLocation({
            coords,
            name: "My Location",
          });
        },
        () => {
          // If permission not granted, stay on Delhi default
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  // Restore Map state from URL query parameters (1-click shared links)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const lat = parseFloat(searchParams.get("lat") || "");
      const lng = parseFloat(searchParams.get("lng") || "");
      const layer = searchParams.get("layer");
      const placeId = searchParams.get("place");

      if (layer === "osm" || layer === "satellite" || layer === "dark" || layer === "terrain") {
        setActiveLayer(layer as LayerType);
      }

      if (placeId) {
        const found = DELHI_PRIMARY_LANDMARKS.find((p) => p.id === placeId);
        if (found) {
          setSelectedLandmark(found);
          setFlyToCoords(found.coordinates);
          setWeatherLocation({
            coords: found.coordinates,
            name: found.name,
          });
          return;
        }
      }

      if (!isNaN(lat) && !isNaN(lng)) {
        setFlyToCoords([lat, lng]);
      }
    }
  }, []);

  // Handle Geolocation with comprehensive error fallbacks
  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      const msg = "Geolocation is not supported by your browser.";
      setUserLocation((prev) => ({ ...prev, loading: false, error: msg }));
      setErrorNotice(msg);
      return;
    }

    setUserLocation((prev) => ({ ...prev, loading: true, error: null }));
    setErrorNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation({
          coords,
          accuracy: pos.coords.accuracy,
          loading: false,
          error: null,
        });
        setFlyToCoords(coords);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`
          );
          if (res.ok) {
            const data = await res.json();
            const detectedCity =
              data.address?.city ||
              data.address?.town ||
              data.address?.suburb ||
              data.address?.state_district ||
              data.address?.state ||
              "My Location";

            setWeatherLocation({
              coords,
              name: detectedCity,
            });
            return;
          }
        } catch {
          // fallback
        }

        setWeatherLocation({
          coords,
          name: "My Location",
        });
      },
      (err) => {
        let msg = "Unable to retrieve your location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access in your browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location information is currently unavailable.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please try again.";
        }
        setUserLocation((prev) => ({ ...prev, loading: false, error: msg }));
        setErrorNotice(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  // Sync dark class on html with localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("delhi_theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("delhi_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("delhi_theme", "light");
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleSelectLandmark = (landmark: LandmarkLocation | null) => {
    setSelectedLandmark(landmark);
    if (landmark) {
      setFlyToCoords(landmark.coordinates);
      const cleanName = landmark.name.split(",")[0].trim();
      setWeatherLocation({
        coords: landmark.coordinates,
        name: cleanName,
      });
    }
  };

  // Level 2: Bi-directional selection from Sidebar to Map and vice-versa
  const handleSelectClusterMarker = (marker: MarkerPoi) => {
    setSelectedClusterMarker(marker);
    setFlyToCoords(marker.coordinates);
    setWeatherLocation({
      coords: marker.coordinates,
      name: marker.name,
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-100 dark:bg-[#1f1f1f]">
      {/* Top-Left Floating Google Maps Search Card */}
      <GoogleMapsSearchCard
        selectedLandmark={selectedLandmark}
        onSelectLandmark={handleSelectLandmark}
        onFlyTo={(coords) => setFlyToCoords(coords)}
        onToggleMenu={() => setIsDrawerOpen(true)}
        onOpenAi={() => setIsAskMapsOpen(true)}
        weatherLocation={weatherLocation}
        showDistricts={showDistrictsGeoJson}
        onToggleDistricts={() => setShowDistrictsGeoJson((prev) => !prev)}
        showPlacesExplorer={isPlacesExplorerOpen}
        onTogglePlacesExplorer={() => setIsPlacesExplorerOpen((prev) => !prev)}
        totalMarkersCount={allMarkers.length || 1200}
      />

      {/* Top-Right Dynamic Weather & Air Quality Widget (Desktop View only) */}
      <div className="hidden sm:block">
        <DelhiWeatherWidget
          currentCoords={weatherLocation.coords}
          locationName={weatherLocation.name}
          onFlyToCoords={(coords) => setFlyToCoords(coords)}
        />
      </div>

      {/* Level 2: Delhi 11 Districts Choropleth Legend & District Card */}
      <ChoroplethLegend
        visible={showDistrictsGeoJson}
        activeMetric={activeChoroplethMetric}
        selectedDistrict={selectedDistrict}
        onCloseDistrict={() => setSelectedDistrict(null)}
        onChangeMetric={setActiveChoroplethMetric}
        onToggleVisible={() => setShowDistrictsGeoJson(false)}
      />

      {/* Level 2: Places Explorer Sidebar (1,200 Markers with Bi-directional Sync) */}
      <Sidebar
        markers={filteredMarkers}
        selectedMarkerId={selectedClusterMarker?.id || null}
        onSelectMarker={handleSelectClusterMarker}
        isOpen={isPlacesExplorerOpen}
        onClose={() => setIsPlacesExplorerOpen(false)}
        selectedCategory={sidebarCategory}
        onSelectCategory={setSidebarCategory}
        searchQuery={sidebarSearch}
        onSearchChange={setSidebarSearch}
        totalCount={allMarkers.length || 1200}
        categoryCounts={categoryCounts}
      />

      {/* Hamburger Navigation Drawer */}
      <GoogleMapsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeLayer={activeLayer}
        onChangeLayer={setActiveLayer}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenAskMaps={() => setIsAskMapsOpen(true)}
        showDistricts={showDistrictsGeoJson}
        onToggleDistricts={() => setShowDistrictsGeoJson((prev) => !prev)}
        showMarkerClusters={showMarkerClusters}
        onToggleMarkerClusters={() => setShowMarkerClusters((prev) => !prev)}
        onOpenPlacesExplorer={() => setIsPlacesExplorerOpen(true)}
        totalMarkersCount={allMarkers.length || 1200}
      />

      {/* Dedicated Delhi Explorer AI Panel */}
      <AskMapsModal
        isOpen={isAskMapsOpen}
        onClose={() => setIsAskMapsOpen(false)}
        onFlyToCoords={(coords) => setFlyToCoords(coords)}
        currentLocationName={weatherLocation.name}
        userCoordinates={weatherLocation.coords}
        selectedLandmark={selectedLandmark}
      />

      {/* Global Error Banner */}
      {errorNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-rose-600 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in">
          <span>{errorNotice}</span>
          <button
            onClick={() => setErrorNotice(null)}
            className="p-0.5 rounded-full hover:bg-rose-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Full-screen Leaflet Map Canvas */}
      <main className="w-full h-full relative">
        <DynamicMapView
          activeLayer={activeLayer}
          onChangeLayer={setActiveLayer}
          selectedLandmark={selectedLandmark}
          onSelectLandmark={handleSelectLandmark}
          flyToLocation={flyToCoords}
          userLocation={userLocation}
          onLocateUser={handleLocateUser}
          isDarkMode={isDarkMode}
          showDistricts={showDistrictsGeoJson}
          activeChoroplethMetric={activeChoroplethMetric}
          onSelectDistrict={setSelectedDistrict}
          showMarkerClusters={showMarkerClusters}
          clusterMarkers={filteredMarkers}
          selectedClusterMarkerId={selectedClusterMarker?.id || null}
          onSelectClusterMarker={handleSelectClusterMarker}
        />
      </main>
    </div>
  );
}
