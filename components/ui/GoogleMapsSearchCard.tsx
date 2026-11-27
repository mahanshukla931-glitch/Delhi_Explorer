"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Search,
  Menu,
  X,
  ChevronRight,
  Navigation,
  ExternalLink,
  Loader2,
  Globe,
  Mic,
  MicOff,
  Sparkles,
  Train,
  Bookmark,
  Star,
  MapPin,
  Share2,
} from "lucide-react";
import { DELHI_PRIMARY_LANDMARKS } from "@/lib/constants";
import { LandmarkLocation } from "@/types/map";
import { isLandmarkSaved, toggleLandmarkSaved } from "@/lib/bookmarks";
import { DelhiWeatherWidget } from "@/components/ui/DelhiWeatherWidget";

interface GoogleMapsSearchCardProps {
  selectedLandmark: LandmarkLocation | null;
  onSelectLandmark: (landmark: LandmarkLocation | null) => void;
  onFlyTo: (coords: [number, number]) => void;
  onToggleMenu: () => void;
  onOpenAi?: () => void;
  weatherLocation?: {
    coords: [number, number];
    name: string;
  };
  showDistricts?: boolean;
  onToggleDistricts?: () => void;
  showMetroLines?: boolean;
  onToggleMetroLines?: () => void;
  showPlacesExplorer?: boolean;
  onTogglePlacesExplorer?: () => void;
  totalMarkersCount?: number;
  onOpenShare?: (data: { title: string; url: string; description?: string }) => void;
  onRequestDirections?: (coords: [number, number], name: string) => void;
  showDrawTools?: boolean;
  onToggleDrawTools?: () => void;
  onToggleNearbyPlaces?: () => void;
  isNearbyActive?: boolean;
}

interface SearchResultItem {
  id: string;
  name: string;
  displayName: string;
  category: string;
  coordinates: [number, number];
  address?: Record<string, string>;
}

interface SpeechEvent {
  results: { [key: number]: { [key: number]: { transcript: string } } };
  error?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: SpeechEvent) => void) | null;
  onend: (() => void) | null;
}

export function GoogleMapsSearchCard({
  selectedLandmark,
  onSelectLandmark,
  onFlyTo,
  onToggleMenu,
  onOpenAi,
  weatherLocation,
  showDistricts,
  onToggleDistricts,
  showMetroLines,
  onToggleMetroLines,
  showPlacesExplorer,
  onTogglePlacesExplorer,
  onOpenShare,
  onRequestDirections,
  showDrawTools,
  onToggleDrawTools,
  onToggleNearbyPlaces,
  isNearbyActive,
}: GoogleMapsSearchCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isFocused, setIsFocused] = useState(false);
  const [liveResults, setLiveResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [, setBookmarkRevision] = useState(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Re-render when bookmarks are updated anywhere
  useEffect(() => {
    const handleBookmarkChange = () => setBookmarkRevision((r) => r + 1);
    window.addEventListener("delhi_bookmarks_changed", handleBookmarkChange);
    return () => window.removeEventListener("delhi_bookmarks_changed", handleBookmarkChange);
  }, []);

  const categories = [
    { id: "all", label: "All Places", icon: "✨" },
    { id: "monument", label: "Monuments", icon: "🏛️" },
    { id: "heritage", label: "Heritage", icon: "🏰" },
    { id: "religious", label: "Religious", icon: "🛕" },
    { id: "commercial", label: "Shopping & CP", icon: "🛍️" },
  ];

  // Initialize Web Speech API for Mic Voice Search safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const SpeechRecognitionConstructor =
          (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
          (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

        if (SpeechRecognitionConstructor) {
          const recognition = new SpeechRecognitionConstructor();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = "en-IN"; // English (India) / Hindi phonetic friendly

          recognition.onstart = () => {
            setIsListening(true);
          };

          recognition.onresult = (event: SpeechEvent) => {
            const transcript = event.results[0]?.[0]?.transcript;
            if (transcript) {
              setSearchQuery(transcript);
              setIsFocused(true);
            }
            setIsListening(false);
          };

          recognition.onerror = (event: SpeechEvent) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        }
      } catch (err) {
        console.warn("Speech recognition initialization skipped:", err);
      }
    }
  }, []);

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert("Voice search is not supported on this browser. Please use Chrome/Edge or type manually.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Mic stop error:", err);
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Mic start error:", err);
        setIsListening(false);
      }
    }
  };

  // Local Delhi landmarks matching
  const filteredLocalLandmarks = DELHI_PRIMARY_LANDMARKS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.hindiName && item.hindiName.includes(searchQuery)) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "all" || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Debounced Live All-India Geocoding Search via OpenStreetMap Nominatim
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setLiveResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setLiveResults(data.results || []);
        } else {
          setLiveResults([]);
        }
      } catch (err) {
        console.error("Live search error:", err);
        setLiveResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 1000); // Debounce to strictly adhere to Nominatim <= 1 req/sec limit

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery]);

  const handleSelectSearchResult = async (result: SearchResultItem) => {
    const initialLandmark: LandmarkLocation = {
      id: result.id,
      name: result.name,
      category: "monument",
      coordinates: result.coordinates,
      description: result.displayName,
      highlights: [
        result.address?.state || "India",
        result.address?.city || result.address?.county || "Area",
      ],
      address: result.displayName,
    };

    onSelectLandmark(initialLandmark);
    onFlyTo(result.coordinates);
    setIsFocused(false);
    setSearchQuery("");

    // Auto-fetch real high-res photography for this searched Indian location via Wikipedia API
    try {
      const cleanName = result.name.split(",")[0].trim();
      const area = result.address?.city || result.address?.state || "";
      const query = `${cleanName} ${area}`.trim();
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&pithumbsize=800&generator=search&gsrsearch=${encodeURIComponent(
        query
      )}&gsrlimit=1&origin=*`;

      const res = await fetch(wikiUrl);
      if (res.ok) {
        const data = await res.json();
        const pages = data.query?.pages;
        if (pages) {
          const firstPage = Object.values(pages)[0] as { thumbnail?: { source: string } };
          if (firstPage?.thumbnail?.source) {
            onSelectLandmark({
              ...initialLandmark,
              imageUrl: firstPage.thumbnail.source,
            });
          }
        }
      }
    } catch (err) {
      console.warn("Wiki place photo fetch skipped:", err);
    }
  };

  // Automatically fetch Wikipedia photo for any selected landmark across India if image is missing
  useEffect(() => {
    if (selectedLandmark && !selectedLandmark.imageUrl) {
      const cleanName = selectedLandmark.name.split(",")[0].trim();
      const query = `${cleanName} India`;
      fetch(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&pithumbsize=800&generator=search&gsrsearch=${encodeURIComponent(
          query
        )}&gsrlimit=1&origin=*`
      )
        .then((res) => res.json())
        .then((data) => {
          const pages = data.query?.pages;
          if (pages) {
            const first = Object.values(pages)[0] as { thumbnail?: { source: string } };
            if (first?.thumbnail?.source) {
              onSelectLandmark({
                ...selectedLandmark,
                imageUrl: first.thumbnail.source,
              });
            }
          }
        })
        .catch(() => {});
    }
  }, [selectedLandmark?.id]);

  return (
    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 w-[calc(100vw-24px)] max-w-[430px] pointer-events-none flex flex-col gap-2.5">
      {/* 1. Search Bar */}
      <div
        className={`pointer-events-auto relative rounded-full transition-all duration-200 ${
          isFocused
            ? "shadow-[0_4px_20px_rgba(37,99,235,0.25)] ring-2 ring-blue-500/80"
            : "shadow-[0_2px_6px_rgba(60,64,67,0.3),0_1px_2px_rgba(60,64,67,0.15)] hover:shadow-[0_2px_8px_rgba(60,64,67,0.4)]"
        }`}
      >
        {/* Search Bar Content */}
        <div
          className={`relative z-10 bg-white dark:bg-[#202124] rounded-full flex items-center h-12 px-3 gap-1.5 border overflow-hidden ${
            isFocused ? "border-blue-500" : "border-slate-200/80 dark:border-slate-700/60"
          }`}
        >
          {/* Menu Hamburger */}
          <button
            onClick={onToggleMenu}
            aria-label="Toggle Navigation Menu"
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Input */}
          <input
            type="text"
            placeholder={isListening ? "Listening... Speak now" : "Search Delhi Explorer..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedLandmark) onSelectLandmark(null);
            }}
            onFocus={() => setIsFocused(true)}
            className={`flex-1 min-w-0 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none ${
              isListening ? "animate-pulse text-blue-600 font-semibold" : ""
            }`}
          />

          {/* Right Action Icons Cluster (Fixed width & shrink-0: Never shifts right logo) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Swaps Clear [X] and Mic so bar width stays 100% constant without pushing the logo */}
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setLiveResults([]);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-300 transition-all duration-150 hover:scale-105 active:scale-95 shadow-xs shrink-0"
                aria-label="Clear Search"
                title="Clear Search"
              >
                <X className="w-4 h-4" strokeWidth={2.2} />
              </button>
            ) : (
              <button
                onClick={toggleVoiceSearch}
                title={isListening ? "Listening... Click to stop" : "Search by voice"}
                aria-label="Voice Search"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 shrink-0 ${
                  isListening
                    ? "bg-rose-500 text-white animate-bounce shadow-md"
                    : "bg-slate-100/90 hover:bg-blue-50 dark:bg-slate-800/90 dark:hover:bg-blue-950/40 border border-slate-200/90 dark:border-slate-700/80 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 shadow-xs"
                }`}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" strokeWidth={2.2} />
                ) : (
                  <Mic className="w-4 h-4" strokeWidth={2.2} />
                )}
              </button>
            )}

            {/* Delhi Explorer AI Button with Sparkles Icon */}
            <button
              onClick={onOpenAi}
              title="Delhi Explorer AI Assistant"
              aria-label="Delhi Explorer AI Assistant"
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.35)] hover:shadow-[0_4px_12px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95 hover:brightness-110 transition-all duration-150 shrink-0 group"
            >
              <Sparkles className="w-4 h-4 text-white fill-white/20 transition-transform group-hover:rotate-12" strokeWidth={2} />
            </button>

            {/* Search Action / Spinner */}
            {isLoading ? (
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
            ) : (
              <button
                onClick={() => {
                  if (filteredLocalLandmarks.length > 0) {
                    onSelectLandmark(filteredLocalLandmarks[0]);
                    onFlyTo(filteredLocalLandmarks[0].coordinates);
                  } else {
                    setIsFocused(true);
                  }
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 shrink-0"
                title="Search"
              >
                <Search className="w-4 h-4" strokeWidth={2.2} />
              </button>
            )}

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0 mx-0.5" />

            {/* App Logo Avatar (Firmly pinned on the right) */}
            <button
              onClick={onToggleMenu}
              title="Delhi Explorer Menu"
              className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600 shrink-0 hover:scale-105 transition-transform bg-white dark:bg-slate-800 p-0.5"
            >
              <Image
                src="/brand/icon-192.png"
                alt="Delhi Explorer"
                width={30}
                height={30}
                className="w-full h-full object-contain"
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sleek Horizontal Category Chips */}
      <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 max-w-[calc(100vw-24px)] scrollbar-none no-scrollbar select-none">
        {/* Mobile-only Live Weather Pill Chip */}
        {weatherLocation && (
          <div className="sm:hidden shrink-0">
            <DelhiWeatherWidget
              currentCoords={weatherLocation.coords}
              locationName={weatherLocation.name}
              onFlyToCoords={onFlyTo}
              className="relative pointer-events-auto shrink-0"
            />
          </div>
        )}

        {/* 1. Level 2 Places Directory Chip */}
        {onTogglePlacesExplorer && (
          <button
            onClick={onTogglePlacesExplorer}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 transition-all ${
              showPlacesExplorer
                ? "bg-blue-600 text-white ring-2 ring-blue-400/40"
                : "bg-white dark:bg-[#202124] text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            <span>1,200 Places</span>
          </button>
        )}

        {/* 2. Delhi Metro Network Chip */}
        {onToggleMetroLines && (
          <button
            onClick={onToggleMetroLines}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 transition-all ${
              showMetroLines
                ? "bg-amber-500 text-white ring-2 ring-amber-300/40"
                : "bg-white dark:bg-[#202124] text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            <Train className="w-3.5 h-3.5 text-amber-500" />
            <span>Metro</span>
          </button>
        )}

        {/* 3. Delhi 11 Districts GeoJSON Chip */}
        {onToggleDistricts && (
          <button
            onClick={onToggleDistricts}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 transition-all ${
              showDistricts
                ? "bg-indigo-600 text-white ring-2 ring-indigo-400/40"
                : "bg-white dark:bg-[#202124] text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>🏛️</span>
            <span>Districts</span>
          </button>
        )}

        {/* 4. Level 3: Geoman Drawing & Measurement Tools Chip */}
        {onToggleDrawTools && (
          <button
            onClick={onToggleDrawTools}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 transition-all ${
              showDrawTools
                ? "bg-purple-600 text-white ring-2 ring-purple-400/40"
                : "bg-white dark:bg-[#202124] text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>✏️</span>
            <span>Draw & Measure</span>
          </button>
        )}

        {/* 5. Level 3: Overpass API Find Nearby Chip */}
        {onToggleNearbyPlaces && (
          <button
            onClick={onToggleNearbyPlaces}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 transition-all ${
              isNearbyActive
                ? "bg-emerald-600 text-white ring-2 ring-emerald-400/40"
                : "bg-white dark:bg-[#202124] text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>🔍</span>
            <span>Find Nearby</span>
          </button>
        )}

        {/* 4. Filter categories (Monuments, Heritage, Religious, Shopping) */}
        {categories
          .filter((cat) => cat.id !== "all")
          .map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(isSelected ? "all" : cat.id);
                  if (selectedLandmark) onSelectLandmark(null);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95 ${
                  isSelected
                    ? "bg-blue-600 text-white font-bold shadow-md ring-2 ring-blue-400/30"
                    : "bg-white dark:bg-[#202124] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/70"
                }`}
              >
                <span className="text-xs">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
      </div>

      {/* 3. Floating Place Details Card */}
      {selectedLandmark && (
        <div className="pointer-events-auto bg-white dark:bg-[#202124] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] border border-slate-200/80 dark:border-slate-700/60 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Real HD Photo Card Header */}
          {selectedLandmark.imageUrl && !brokenImages[selectedLandmark.id] ? (
            <div className="h-36 relative overflow-hidden text-white group bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedLandmark.imageUrl}
                alt={selectedLandmark.name}
                referrerPolicy="no-referrer"
                onError={() => {
                  setBrokenImages((prev) => ({ ...prev, [selectedLandmark.id]: true }));
                }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 pointer-events-none" />

              {/* Top controls: Category, Bookmark, Close */}
              <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20">
                  {selectedLandmark.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (typeof window === "undefined") return;
                      const shareUrl = `${window.location.origin}${window.location.pathname}?place=${selectedLandmark.id}&lat=${selectedLandmark.coordinates[0]}&lng=${selectedLandmark.coordinates[1]}&z=16`;
                      if (onOpenShare) {
                        onOpenShare({
                          title: selectedLandmark.name,
                          url: shareUrl,
                          description: selectedLandmark.description,
                        });
                      }
                    }}
                    className="p-1.5 rounded-full backdrop-blur-md transition-all shadow-md bg-black/50 hover:bg-black/70 text-white"
                    title="Share on WhatsApp or Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleLandmarkSaved(selectedLandmark.id)}
                    className={`p-1.5 rounded-full backdrop-blur-md transition-all shadow-md ${
                      isLandmarkSaved(selectedLandmark.id)
                        ? "bg-amber-500 text-white"
                        : "bg-black/50 hover:bg-black/70 text-white"
                    }`}
                    title={
                      isLandmarkSaved(selectedLandmark.id)
                        ? "Saved in Favorites"
                        : "Save to Favorites"
                    }
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        isLandmarkSaved(selectedLandmark.id) ? "fill-white" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => onSelectLandmark(null)}
                    className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                    aria-label="Close card"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Info: Title, Hindi name, Rating */}
              <div className="absolute bottom-2.5 left-3 right-3 z-10">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold leading-tight drop-shadow-md">
                    {selectedLandmark.name}
                  </h2>
                  {selectedLandmark.rating && (
                    <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-300 bg-black/60 px-1.5 py-0.5 rounded-md border border-white/20">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {selectedLandmark.rating}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-28 bg-gradient-to-tr from-blue-700 via-indigo-700 to-rose-600 relative p-3.5 flex flex-col justify-between text-white">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20">
                  {selectedLandmark.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (typeof window === "undefined") return;
                      const shareUrl = `${window.location.origin}${window.location.pathname}?place=${selectedLandmark.id}&lat=${selectedLandmark.coordinates[0]}&lng=${selectedLandmark.coordinates[1]}&z=16`;
                      if (onOpenShare) {
                        onOpenShare({
                          title: selectedLandmark.name,
                          url: shareUrl,
                          description: selectedLandmark.description,
                        });
                      }
                    }}
                    className="p-1.5 rounded-full backdrop-blur-md transition-all shadow-md bg-black/40 hover:bg-black/60 text-white"
                    title="Share on WhatsApp or Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleLandmarkSaved(selectedLandmark.id)}
                    className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                      isLandmarkSaved(selectedLandmark.id)
                        ? "bg-amber-500 text-white"
                        : "bg-black/40 hover:bg-black/60 text-white"
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        isLandmarkSaved(selectedLandmark.id) ? "fill-white" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => onSelectLandmark(null)}
                    className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                    aria-label="Close card"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight drop-shadow-md">
                  {selectedLandmark.name}
                </h2>
              </div>
            </div>
          )}

          <div className="p-4 space-y-3 max-h-[calc(100vh-290px)] overflow-y-auto">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedLandmark.description}
            </p>

            <div className="grid grid-cols-1 gap-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
              {selectedLandmark.builtYear && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Built Period:</span>
                  <span className="font-semibold">{selectedLandmark.builtYear}</span>
                </div>
              )}
              {selectedLandmark.architect && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400">Architect:</span>
                  <span className="font-semibold truncate max-w-[200px]">
                    {selectedLandmark.architect}
                  </span>
                </div>
              )}
              {selectedLandmark.metroStation && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    Nearest Metro:
                  </span>
                  <span className="font-semibold truncate max-w-[200px]">
                    {selectedLandmark.metroStation}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono pt-1">
                <span>Coordinates:</span>
                <span>
                  {selectedLandmark.coordinates[0].toFixed(4)}°,{" "}
                  {selectedLandmark.coordinates[1].toFixed(4)}°
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  if (onRequestDirections) {
                    onRequestDirections(selectedLandmark.coordinates, selectedLandmark.name);
                  } else {
                    onFlyTo(selectedLandmark.coordinates);
                  }
                }}
                className="flex-1 py-2.5 px-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Navigation className="w-3.5 h-3.5 fill-white" />
                <span>Directions & Route</span>
              </button>

              <a
                href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                  selectedLandmark.name + " Delhi India"
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="View on OpenStreetMap"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4. Live Search Autocomplete & Prominent Places Dropdown */}
      {!selectedLandmark && (searchQuery || isFocused) && (
        <div className="pointer-events-auto bg-white dark:bg-[#202124] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.28)] border border-slate-200/90 dark:border-slate-700/70 max-h-[440px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {searchQuery ? `Search Results for "${searchQuery}"` : "Prominent Places in Delhi"}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {searchQuery ? liveResults.length + filteredLocalLandmarks.length : filteredLocalLandmarks.length}
              </span>
            </div>

            <button
              onClick={() => setIsFocused(false)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline p-1"
            >
              Close
            </button>
          </div>

          {/* Quick Category Filter Badges */}
          {!searchQuery && (
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#202124] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {categories.map((c) => {
                const isSelected = activeCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`text-[10px] px-2.5 py-0.8 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                      isSelected
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 scrollbar-thin">
            {isLoading && (
              <div className="p-4 flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching all-India places...</span>
              </div>
            )}

            {/* All-India Nominatim Live Results */}
            {liveResults.length > 0 && (
              <div>
                <div className="px-3.5 py-1.5 bg-blue-50/60 dark:bg-blue-950/30 text-[9px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>All-India Geographic Discoveries</span>
                </div>
                {liveResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/60 dark:hover:bg-slate-800/80 flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.displayName}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                      Fly To →
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Local Delhi Landmarks with Rich Visual Card Layout */}
            {filteredLocalLandmarks.map((loc) => {
              const categoryDetails =
                loc.category === "monument"
                  ? { icon: "🏛️", label: "Monument", badgeBg: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900" }
                  : loc.category === "heritage"
                  ? { icon: "🏰", label: "Heritage", badgeBg: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900" }
                  : loc.category === "religious"
                  ? { icon: "🛕", label: "Religious", badgeBg: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-900" }
                  : { icon: "🛍️", label: "Commercial", badgeBg: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900" };

              const isSaved = isLandmarkSaved(loc.id);

              return (
                <div
                  key={loc.id}
                  onClick={() => {
                    onSelectLandmark(loc);
                    onFlyTo(loc.coordinates);
                    setIsFocused(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/50 dark:hover:bg-slate-800/80 flex items-center gap-3 transition-colors group relative border-l-2 border-l-transparent hover:border-l-blue-600 cursor-pointer"
                >
                  {/* Category Themed Icon Box or HD Photo Thumbnail */}
                  {loc.imageUrl && !brokenImages[loc.id] ? (
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-200/90 dark:border-slate-700 relative shadow-xs group-hover:scale-105 transition-transform bg-slate-100 dark:bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={loc.imageUrl}
                        alt={loc.name}
                        referrerPolicy="no-referrer"
                        onError={() => {
                          setBrokenImages((prev) => ({ ...prev, [loc.id]: true }));
                        }}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {loc.rating && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-[8px] font-bold text-amber-300 text-center flex items-center justify-center gap-0.5 py-0.5">
                          <Star className="w-2 h-2 fill-amber-300" />
                          <span>{loc.rating}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 flex items-center justify-center text-base shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      {categoryDetails.icon}
                    </div>
                  )}

                  {/* Place Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {loc.name}
                      </h4>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${categoryDetails.badgeBg}`}>
                        {categoryDetails.label}
                      </span>
                    </div>

                    {/* Metro Line & Area Subtitle */}
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {loc.metroStation && (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate">
                          <Train className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">{loc.metroStation}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Bookmark + Navigate */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLandmarkSaved(loc.id);
                      }}
                      title={isSaved ? "Remove from Favorites" : "Save to Favorites"}
                      className={`p-1.5 rounded-full transition-colors ${
                        isSaved
                          ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          : "text-slate-300 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-500" : ""}`} />
                    </button>

                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100/80 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                      Navigate →
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Tip */}
          <div className="p-2 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between shrink-0 px-3.5">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Click any place to fly & explore</span>
            </span>
            <span className="font-mono text-[9px]">Delhi Explorer</span>
          </div>
        </div>
      )}
    </div>
  );
}
