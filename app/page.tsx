"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { GoogleMapsSearchCard } from "@/components/ui/GoogleMapsSearchCard";
import { DelhiWeatherWidget } from "@/components/ui/DelhiWeatherWidget";
import { MapLoadingSkeleton } from "@/components/ui/MapLoadingSkeleton";
import { MapErrorBoundary } from "@/components/ui/MapErrorBoundary";
import { ChoroplethLegend } from "@/components/ui/ChoroplethLegend";
import { MobileBottomBar } from "@/components/ui/MobileBottomBar";
import { NearbyPlaceItem } from "@/components/map/NearbyMarkersLayer";
import { MetroStation } from "@/lib/metroData";
import { RouteData, TravelMode } from "@/types/routing";
import { LayerType, LandmarkLocation, UserLocationState } from "@/types/map";
import { DistrictProperties, MarkerPoi } from "@/types/geojson";
import { DELHI_PRIMARY_LANDMARKS } from "@/lib/constants";

// Lazy-load drawers, modals & heavy tool components to minimize initial JS bundle
const GoogleMapsDrawer = dynamic(
  () => import("@/components/ui/GoogleMapsDrawer").then((m) => m.GoogleMapsDrawer),
  { ssr: false }
);
const AskMapsModal = dynamic(
  () => import("@/components/ui/AskMapsModal").then((m) => m.AskMapsModal),
  { ssr: false }
);
const Sidebar = dynamic(
  () => import("@/components/sidebar/Sidebar").then((m) => m.Sidebar),
  { ssr: false }
);
const ShareModal = dynamic(
  () => import("@/components/ui/ShareModal").then((m) => m.ShareModal),
  { ssr: false }
);
const DirectionsDrawer = dynamic(
  () => import("@/components/ui/DirectionsDrawer").then((m) => m.DirectionsDrawer),
  { ssr: false }
);
const NearbyPlacesDrawer = dynamic(
  () => import("@/components/ui/NearbyPlacesDrawer").then((m) => m.NearbyPlacesDrawer),
  { ssr: false }
);
const DrawToolsFloatingBar = dynamic(
  () => import("@/components/ui/DrawToolsFloatingBar").then((m) => m.DrawToolsFloatingBar),
  { ssr: false }
);
const NavigationSimulationBanner = dynamic(
  () =>
    import("@/components/ui/NavigationSimulationBanner").then(
      (m) => m.NavigationSimulationBanner
    ),
  { ssr: false }
);

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
  const [activeDistrictFilter, setActiveDistrictFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recommended" | "rating" | "reviews" | "name">("recommended");
  const [isOpenNowOnly, setIsOpenNowOnly] = useState<boolean>(false);

  // Level 2 State: Delhi 11 Districts GeoJSON & Choropleth
  const [showDistrictsGeoJson, setShowDistrictsGeoJson] = useState(false);
  const [activeChoroplethMetric, setActiveChoroplethMetric] = useState<
    "density" | "population" | "literacyRate" | "areaKm2"
  >("density");
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictProperties | null>(null);

  // Delhi Metro, Traffic & Heatmap State
  const [showMetroLines, setShowMetroLines] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Level 3: Navigation & Routing State
  const [activeRoute, setActiveRoute] = useState<RouteData | null>(null);
  const [isDirectionsDrawerOpen, setIsDirectionsDrawerOpen] = useState(false);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  // Level 3: Drawing & Measurement Tools State
  const [showDrawTools, setShowDrawTools] = useState(false);
  const [activeDrawColor, setActiveDrawColor] = useState("#2563eb");
  const [isNavSimActive, setIsNavSimActive] = useState(false);
  const [navSimPosition, setNavSimPosition] = useState<[number, number] | null>(null);
  const [navSimBearing, setNavSimBearing] = useState<number>(0);

  // Level 3: Overpass Nearby Search State
  const [isNearbyDrawerOpen, setIsNearbyDrawerOpen] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceItem[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [nearbyCategory, setNearbyCategory] = useState("cafe");
  const [nearbyRadius, setNearbyRadius] = useState(1000);
  const [currentMapCenter, setCurrentMapCenter] = useState<[number, number]>([28.6139, 77.209]);

  // 1-Click WhatsApp & Web Share State
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    description?: string;
  }>({
    isOpen: false,
    title: "Delhi Explorer",
    url: "",
  });

  const handleOpenShare = (data: { title: string; url: string; description?: string }) => {
    setShareModalData({
      isOpen: true,
      title: data.title,
      url: data.url,
      description: data.description,
    });
  };

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

  // Level 2: Fetch 1,200+ Marker records (Deferred to requestIdleCallback for ultra-fast LCP & TBT)
  useEffect(() => {
    let cancelled = false;

    const loadMarkers = () => {
      if (cancelled) return;
      fetch("/api/markers")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load markers");
          return res.json();
        })
        .then((data) => {
          if (cancelled) return;
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
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (window as Window & { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => number }).requestIdleCallback(loadMarkers, { timeout: 1500 });
      return () => {
        cancelled = true;
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
      };
    } else {
      const timer = setTimeout(loadMarkers, 600);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, []);

  // Level 2 Pro: Bi-directional filtering on Category, District, Open Now, Search Query, & Sorting
  useEffect(() => {
    let result = [...allMarkers];

    if (sidebarCategory !== "all") {
      if (sidebarCategory === "heritage") {
        result = result.filter((m) => m.category === "heritage" || m.category === "monument");
      } else if (sidebarCategory === "monument") {
        result = result.filter((m) => m.category === "monument" || m.category === "heritage");
      } else {
        result = result.filter((m) => m.category === sidebarCategory);
      }
    }

    if (activeDistrictFilter) {
      const distLower = activeDistrictFilter.toLowerCase().replace("delhi", "").trim();
      result = result.filter(
        (m) =>
          m.address?.toLowerCase().includes(distLower) ||
          m.hub?.toLowerCase().includes(distLower)
      );
    }

    if (isOpenNowOnly) {
      result = result.filter((m) => m.isOpenNow);
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

    // Pro Sorting Controls
    if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "reviews") {
      result.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredMarkers(result);
  }, [allMarkers, sidebarCategory, activeDistrictFilter, isOpenNowOnly, sidebarSearch, sortBy]);

  // District POI count bridge
  const districtPoiCount = useMemo(() => {
    if (!selectedDistrict || !allMarkers.length) return 0;
    const nameLower = selectedDistrict.name.toLowerCase().replace("delhi", "").trim();
    return allMarkers.filter(
      (m) =>
        m.address?.toLowerCase().includes(nameLower) ||
        m.hub?.toLowerCase().includes(nameLower)
    ).length;
  }, [selectedDistrict, allMarkers]);

  // Dedicated handler for toggling 1,200 Places Explorer ensuring immediate dataset load
  const handleTogglePlacesExplorer = useCallback(() => {
    if (allMarkers.length === 0) {
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
            data.markers.forEach((m: MarkerPoi) => {
              counts[m.category] = (counts[m.category] || 0) + 1;
            });
            setCategoryCounts(counts);
          }
        })
        .catch(console.error);
    }
    setIsPlacesExplorerOpen((prev) => !prev);
  }, [allMarkers.length]);

  const handleViewDistrictPlaces = (districtName: string) => {
    setActiveDistrictFilter(districtName);
    handleTogglePlacesExplorer();
  };

  // Bulletproof user GPS auto-detect and locate function with two-phase fallback
  const detectLocation = useCallback(
    (isUserInitiated = false) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        if (isUserInitiated) {
          const msg = "Geolocation is not supported by your browser.";
          setUserLocation((prev) => ({ ...prev, loading: false, error: msg }));
          setErrorNotice(msg);
        }
        return;
      }

      setUserLocation((prev) => ({ ...prev, loading: true, error: null }));
      if (isUserInitiated) setErrorNotice(null);

      const searchParams = new URLSearchParams(window.location.search);
      const hasSharedLocation =
        searchParams.has("lat") || searchParams.has("place") || searchParams.has("poi");

      const handleSuccess = async (pos: GeolocationPosition) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation({
          coords,
          accuracy: pos.coords.accuracy,
          loading: false,
          error: null,
        });

        // If user explicitly clicked Locate, or if initial load without shared URL, center on user
        if (isUserInitiated || !hasSharedLocation) {
          setFlyToCoords(coords);
        }

        // Reverse geocode via internal resilient API (safe for deployed HTTPS & mobile)
        try {
          const res = await fetch(`/api/reverse?lat=${coords[0]}&lng=${coords[1]}`);
          if (res.ok) {
            const data = await res.json();
            const detectedName =
              data.shortAddress ||
              data.addressDetails?.city ||
              data.addressDetails?.town ||
              data.addressDetails?.suburb ||
              data.addressDetails?.state ||
              "My Current Location";

            if (isUserInitiated || !hasSharedLocation) {
              setWeatherLocation({
                coords,
                name: detectedName,
              });
            }
            return;
          }
        } catch (err) {
          console.warn("Reverse geocode on locate:", err);
        }

        if (isUserInitiated || !hasSharedLocation) {
          setWeatherLocation({
            coords,
            name: "My Location",
          });
        }
      };

      const handleFinalError = (err: GeolocationPositionError) => {
        let msg = "Unable to retrieve your location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access in your browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location unavailable. Please check that GPS is enabled on your device.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please try again.";
        }
        setUserLocation((prev) => ({ ...prev, loading: false, error: msg }));
        if (isUserInitiated) {
          setErrorNotice(msg);
          setTimeout(() => {
            setErrorNotice((current) => (current === msg ? null : current));
          }, 4500);
        }
      };

      // Two-step fallback: Try high accuracy first (e.g. GPS), fallback to coarse accuracy (cellular/Wi-Fi)
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        () => {
          // If high accuracy times out or is unavailable (common on mobile indoors or laptops), retry coarse
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleFinalError,
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 60000,
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 15000,
        }
      );
    },
    []
  );

  // Auto-detect user GPS on initial load
  useEffect(() => {
    detectLocation(false);
  }, [detectLocation]);

  // Restore Map state from URL query parameters (1-click shared links & WhatsApp deep links)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const lat = parseFloat(searchParams.get("lat") || "");
      const lng = parseFloat(searchParams.get("lng") || "");
      const layer = searchParams.get("layer");
      const placeId = searchParams.get("place");
      const poiId = searchParams.get("poi");

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

      if (poiId && allMarkers.length > 0) {
        const foundPoi = allMarkers.find((m) => m.id === poiId);
        if (foundPoi) {
          setSelectedClusterMarker(foundPoi);
          setFlyToCoords(foundPoi.coordinates);
          setWeatherLocation({
            coords: foundPoi.coordinates,
            name: foundPoi.name,
          });
          return;
        }
      }

      if (!isNaN(lat) && !isNaN(lng)) {
        setFlyToCoords([lat, lng]);
      }
    }
  }, [allMarkers]);

  // Handle Geolocation with comprehensive error fallbacks
  const handleLocateUser = useCallback(() => {
    detectLocation(true);
  }, [detectLocation]);

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

  const handleSelectMetroStation = (station: MetroStation) => {
    setFlyToCoords(station.coordinates);
    setWeatherLocation({
      coords: station.coordinates,
      name: `${station.name} (${station.line})`,
    });
  };

  // Level 3: Fetch Directions & Route between Points
  const handleCalculateRoute = async (
    destCoords: [number, number],
    destName: string,
    mode: TravelMode = "driving",
    customStartCoords?: [number, number],
    customOriginName?: string
  ) => {
    try {
      // Auto-close landmark card so it doesn't overlap or block the screen on mobile
      setSelectedLandmark(null);
      setIsRoutingLoading(true);

      // Determine starting point intelligently:
      // - If custom start coordinates are provided, use them.
      // - If user has live GPS location, ALWAYS respect their live location as Point A.
      // - Otherwise, default starting point to central Delhi (India Gate / CP).
      let startCoords: [number, number];
      let originName: string;

      if (customStartCoords && customOriginName) {
        startCoords = customStartCoords;
        originName = customOriginName;
      } else if (userLocation.coords) {
        startCoords = userLocation.coords;
        originName = weatherLocation.name || "Your Live Location (GPS)";
      } else {
        if (destName.toLowerCase().includes("india gate")) {
          startCoords = [28.6328, 77.2197]; // Rajiv Chowk, Connaught Place
          originName = "Connaught Place (CP)";
        } else {
          startCoords = DELHI_PRIMARY_LANDMARKS[0].coordinates;
          originName = "India Gate (Central Delhi)";
        }
      }

      const res = await fetch(
        `/api/route?startLat=${startCoords[0]}&startLng=${startCoords[1]}&endLat=${destCoords[0]}&endLng=${destCoords[1]}&mode=${mode}`
      );

      if (!res.ok) {
        throw new Error("Unable to fetch route");
      }

      const data = await res.json();
      setActiveRoute({
        ...data,
        originName,
        destinationName: destName,
        originCoords: startCoords,
        destinationCoords: destCoords,
      });
      setIsDirectionsDrawerOpen(true);
    } catch (err) {
      console.error(err);
      setErrorNotice("Could not calculate road route. Please verify locations.");
    } finally {
      setIsRoutingLoading(false);
    }
  };

  // Level 3: Overpass API Find Nearby Handler
  const handleSearchNearby = async (
    category: string,
    radius: number,
    customCenter?: [number, number]
  ) => {
    try {
      setIsNearbyLoading(true);
      setNearbyError(null);
      const center = customCenter || currentMapCenter;

      const res = await fetch(
        `/api/nearby?lat=${center[0]}&lng=${center[1]}&radius=${radius}&category=${category}`
      );

      if (!res.ok) {
        throw new Error("Failed to scan nearby places");
      }

      const data = await res.json();
      if (data.elements) {
        setNearbyPlaces(data.elements);
        if (data.elements.length === 0) {
          setErrorNotice(
            `No ${category}s found within ${radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}. Try increasing the radius.`
          );
        }
      }
    } catch (err) {
      console.error("Nearby search error:", err);
      setNearbyError("Overpass API is currently busy or rate-limited. Please retry shortly.");
    } finally {
      setIsNearbyLoading(false);
    }
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
        showMetroLines={showMetroLines}
        onToggleMetroLines={() => setShowMetroLines((prev) => !prev)}
        showPlacesExplorer={isPlacesExplorerOpen}
        onTogglePlacesExplorer={handleTogglePlacesExplorer}
        totalMarkersCount={allMarkers.length || 1200}
        onOpenShare={handleOpenShare}
        onRequestDirections={(coords, name) => handleCalculateRoute(coords, name)}
        showTraffic={showTraffic}
        onToggleTraffic={() => setShowTraffic((prev) => !prev)}
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap((prev) => !prev)}
        showDrawTools={showDrawTools}
        onToggleDrawTools={() => {
          setShowDrawTools((prev) => {
            const next = !prev;
            if (next) {
              setSelectedDistrict(null);
            }
            return next;
          });
        }}
        onToggleNearbyPlaces={() => setIsNearbyDrawerOpen((prev) => !prev)}
        isNearbyActive={isNearbyDrawerOpen || nearbyPlaces.length > 0}
        selectedCategory={sidebarCategory}
        onSelectCategory={setSidebarCategory}
        allMarkers={allMarkers}
      />

      {/* Top-Right Dynamic Weather & Air Quality Widget (Desktop View only) */}
      <div className="hidden sm:block">
        <DelhiWeatherWidget
          currentCoords={weatherLocation.coords}
          locationName={weatherLocation.name}
          onFlyToCoords={(coords) => setFlyToCoords(coords)}
        />
      </div>

      {/* Level 2: Delhi 11 Districts Choropleth Legend & District Card with POI Bridge */}
      <ChoroplethLegend
        visible={showDistrictsGeoJson && !showDrawTools}
        activeMetric={activeChoroplethMetric}
        selectedDistrict={showDrawTools ? null : selectedDistrict}
        onCloseDistrict={() => setSelectedDistrict(null)}
        onChangeMetric={setActiveChoroplethMetric}
        onToggleVisible={() => {
          setShowDistrictsGeoJson(false);
          setSelectedDistrict(null);
        }}
        districtPoiCount={districtPoiCount}
        onViewDistrictPlaces={handleViewDistrictPlaces}
      />

      {/* Level 2 Pro: Places Explorer Sidebar with Sorting & Open Now Filter */}
      {isPlacesExplorerOpen && (
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
          activeDistrictFilter={activeDistrictFilter}
          onClearDistrictFilter={() => setActiveDistrictFilter(null)}
          sortBy={sortBy}
          onSortChange={setSortBy}
          isOpenNowOnly={isOpenNowOnly}
          onToggleOpenNowOnly={() => setIsOpenNowOnly((prev) => !prev)}
        />
      )}

      {/* Hamburger Navigation Drawer */}
      {isDrawerOpen && (
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
          showMetroLines={showMetroLines}
          onToggleMetroLines={() => setShowMetroLines((prev) => !prev)}
          onOpenPlacesExplorer={handleTogglePlacesExplorer}
          totalMarkersCount={allMarkers.length || 1200}
          showTraffic={showTraffic}
          onToggleTraffic={() => setShowTraffic((prev) => !prev)}
          showHeatmap={showHeatmap}
          onToggleHeatmap={() => setShowHeatmap((prev) => !prev)}
          showDrawTools={showDrawTools}
          onToggleDrawTools={() => setShowDrawTools((prev) => !prev)}
          onOpenNearby={() => setIsNearbyDrawerOpen(true)}
        />
      )}

      {/* Dedicated Delhi Explorer AI Panel */}
      {isAskMapsOpen && (
        <AskMapsModal
          isOpen={isAskMapsOpen}
          onClose={() => setIsAskMapsOpen(false)}
          onFlyToCoords={(coords) => setFlyToCoords(coords)}
          currentLocationName={weatherLocation.name}
          userCoordinates={weatherLocation.coords}
          selectedLandmark={selectedLandmark}
        />
      )}

      {/* Level 2 Pro: Floating Places Filter Active Banner */}
      {(filteredMarkers.length < allMarkers.length || activeDistrictFilter || isOpenNowOnly) && (
        <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-white/95 dark:bg-[#1e2023]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xl border border-blue-400 dark:border-blue-600 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 text-xs select-none">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span className="font-bold text-slate-800 dark:text-slate-100">
            Showing {filteredMarkers.length} of {allMarkers.length} places
          </span>
          <button
            onClick={() => {
              setSidebarCategory("all");
              setSidebarSearch("");
              setActiveDistrictFilter(null);
              setIsOpenNowOnly(false);
              setSortBy("recommended");
            }}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Floating Modern Toast Notification */}
      {errorNotice && (
        <div className="absolute top-20 sm:top-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] sm:w-auto bg-slate-900/95 dark:bg-[#1a1b1e]/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 select-none">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
          <span className="flex-1 text-[11.5px] leading-snug">{errorNotice}</span>
          <button
            onClick={() => setErrorNotice(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Full-screen Leaflet Map Canvas */}
      <main className="w-full h-full relative">
        {/* Instant SSR Basemap Paint for LCP < 1.0s */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/delhi-basemap.webp"
            alt="Delhi Map Base"
            width={768}
            height={768}
            className="w-full h-full object-cover opacity-60 dark:opacity-40"
          />
        </div>
        <MapErrorBoundary fallbackTitle="Map Rendering Error">
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
            showMetroLines={showMetroLines}
            onSelectMetroStation={handleSelectMetroStation}
            onOpenShare={handleOpenShare}
            activeRoute={activeRoute}
            onClearRoute={() => {
              setActiveRoute(null);
              setIsDirectionsDrawerOpen(false);
            }}
            showTraffic={showTraffic}
            showHeatmap={showHeatmap}
            showDrawTools={showDrawTools}
            activeDrawColor={activeDrawColor}
            nearbyPlaces={nearbyPlaces}
            onSelectNearbyPlace={(p) => setFlyToCoords(p.coordinates)}
            onRequestDirections={(coords, name) => handleCalculateRoute(coords, name)}
            onFindNearbyHere={(coords) => {
              setCurrentMapCenter(coords);
              setIsNearbyDrawerOpen(true);
              handleSearchNearby(nearbyCategory, nearbyRadius, coords);
            }}
            onMapCenterChange={(center) => setCurrentMapCenter(center)}
            isNavSimActive={isNavSimActive}
            navSimPosition={navSimPosition}
            navSimBearing={navSimBearing}
          />
        </MapErrorBoundary>
      </main>

      {/* Level 3 Pro: Floating GeoJSON Export/Import & Color Palette Management Bar */}
      {showDrawTools && (
        <DrawToolsFloatingBar
          isOpen={showDrawTools}
          onClose={() => setShowDrawTools(false)}
          activeColor={activeDrawColor}
          onChangeColor={setActiveDrawColor}
          onShapesImported={(count) =>
            setErrorNotice(`Successfully imported ${count} shape(s) from GeoJSON!`)
          }
        />
      )}

      {/* Level 3 Pro: Google Maps Style Turn-by-Turn GPS Navigation Preview Banner */}
      {activeRoute && isNavSimActive && (
        <NavigationSimulationBanner
          route={activeRoute}
          isActive={isNavSimActive}
          onExit={() => {
            setIsNavSimActive(false);
            setNavSimPosition(null);
          }}
          onPositionUpdate={(coords, bearing) => {
            setNavSimPosition(coords);
            setNavSimBearing(bearing);
          }}
          onRecenter={() => {
            if (navSimPosition) {
              setFlyToCoords(navSimPosition);
            }
          }}
        />
      )}

      {/* Level 3: Overpass API Find Nearby Drawer */}
      {isNearbyDrawerOpen && (
        <NearbyPlacesDrawer
          isOpen={isNearbyDrawerOpen}
          onClose={() => setIsNearbyDrawerOpen(false)}
          centerCoords={currentMapCenter}
          onSearchNearby={(cat, rad) => handleSearchNearby(cat, rad)}
          isLoading={isNearbyLoading}
          places={nearbyPlaces}
          error={nearbyError}
          onSelectPlace={(p) => setFlyToCoords(p.coordinates)}
          onRequestDirections={(coords, name) => handleCalculateRoute(coords, name)}
          onClearPlaces={() => setNearbyPlaces([])}
          activeCategory={nearbyCategory}
          setActiveCategory={setNearbyCategory}
          activeRadius={nearbyRadius}
          setActiveRadius={setNearbyRadius}
        />
      )}

      {/* Level 3: Turn-by-Turn Navigation & Routing Drawer */}
      {isDirectionsDrawerOpen && (
        <DirectionsDrawer
          route={activeRoute}
          isOpen={isDirectionsDrawerOpen}
          userLocation={userLocation}
          onClose={() => {
            setIsDirectionsDrawerOpen(false);
            setActiveRoute(null);
            setIsNavSimActive(false);
            setNavSimPosition(null);
          }}
          onChangeMode={(mode) => {
            if (activeRoute) {
              handleCalculateRoute(
                activeRoute.destinationCoords,
                activeRoute.destinationName,
                mode,
                activeRoute.originCoords,
                activeRoute.originName
              );
            }
          }}
          onUpdateRoute={(startCoords, destCoords, startName, destName, mode) => {
            handleCalculateRoute(
              destCoords,
              destName,
              mode || activeRoute?.mode || "driving",
              startCoords,
              startName
            );
          }}
          isLoading={isRoutingLoading}
          onStartNavigation={() => {
            setIsDirectionsDrawerOpen(false);
            setIsNavSimActive(true);
          }}
        />
      )}

      {/* Modern Mobile Bottom Bar */}
      <MobileBottomBar
        onOpenPlacesExplorer={handleTogglePlacesExplorer}
        onOpenAi={() => setIsAskMapsOpen(true)}
        showMetroLines={showMetroLines}
        onToggleMetroLines={() => setShowMetroLines((prev) => !prev)}
        onLocateUser={handleLocateUser}
        isLocating={userLocation.loading}
      />

      {/* 1-Click WhatsApp & Web Share Modal */}
      {shareModalData.isOpen && (
        <ShareModal
          isOpen={shareModalData.isOpen}
          onClose={() => setShareModalData((prev) => ({ ...prev, isOpen: false }))}
          title={shareModalData.title}
          shareUrl={shareModalData.url}
          description={shareModalData.description}
        />
      )}
    </div>
  );
}
