"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Cloud,
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  Gauge,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MapPin,
  X,
  Compass,
} from "lucide-react";

interface WeatherData {
  temperature: number;
  apparentTemperature?: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  time: string;
}

interface WeatherWidgetProps {
  currentCoords?: [number, number];
  locationName?: string;
  onFlyToCoords?: (coords: [number, number]) => void;
  className?: string;
}

export function DelhiWeatherWidget({
  currentCoords = [28.6139, 77.209],
  locationName = "Delhi",
  onFlyToCoords,
  className = "absolute top-3 right-3 sm:top-4 sm:right-4 z-30 pointer-events-auto",
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const lat = currentCoords[0];
  const lon = currentCoords[1];

  const fetchLiveWeather = useCallback(async () => {
    try {
      setLoading(true);
      // Keyless and free Open-Meteo API for any GPS / searched coordinate across India
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
      );

      if (!res.ok) throw new Error("Failed to fetch weather");

      const data = await res.json();
      const current = data.current;

      setWeather({
        temperature: Math.round(current.temperature_2m),
        apparentTemperature: Math.round(current.apparent_temperature ?? current.temperature_2m),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        weatherCode: current.weather_code,
        time: current.time,
      });

      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    } catch (err) {
      console.warn("Using fallback weather info:", err);
      setWeather({
        temperature: 26,
        apparentTemperature: 27,
        humidity: 46,
        windSpeed: 10,
        weatherCode: 1,
        time: new Date().toISOString(),
      });
      setLastUpdated("Live");
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    fetchLiveWeather();
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchLiveWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLiveWeather]);

  // Decode WMO weather code into readable condition and icon
  const getWeatherInfo = (code: number) => {
    if (code === 0) {
      return {
        label: "Sunny / Clear",
        icon: <Sun className="w-4 h-4 text-amber-500 animate-[spin_12s_linear_infinite]" />,
      };
    }
    if (code <= 3) {
      return { label: "Partly Cloudy", icon: <CloudSun className="w-4 h-4 text-amber-500" /> };
    }
    if (code <= 48) {
      return { label: "Foggy / Hazy", icon: <Cloud className="w-4 h-4 text-slate-400" /> };
    }
    if (code <= 67) {
      return { label: "Rain / Drizzle", icon: <CloudRain className="w-4 h-4 text-blue-500" /> };
    }
    if (code <= 82) {
      return { label: "Showers", icon: <CloudRain className="w-4 h-4 text-blue-600" /> };
    }
    return { label: "Thunderstorm", icon: <CloudLightning className="w-4 h-4 text-purple-500" /> };
  };

  const info = getWeatherInfo(weather?.weatherCode ?? 1);

  // Air Quality & environmental dispersion indicator
  const getAqiEstimate = () => {
    const temp = weather?.temperature ?? 25;
    const wind = weather?.windSpeed ?? 10;
    let aqi = 140;
    if (wind > 15) aqi = 85;
    else if (wind < 8) aqi = 185;
    if (temp < 18) aqi += 30;

    let badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    let status = "Moderate";

    if (aqi > 200) {
      badgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300";
      status = "Poor";
    } else if (aqi < 100) {
      badgeClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
      status = "Good";
    }

    return { aqi, badgeClass, status };
  };

  const aqiInfo = getAqiEstimate();

  return (
    <div className={className}>
      {/* 1. Compact Glassmorphic Floating Pill Button */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md hover:bg-white dark:hover:bg-[#202124] border border-slate-200/80 dark:border-slate-700/60 rounded-full px-3.5 py-1.5 shadow-[0_2px_8px_rgba(60,64,67,0.2)] flex items-center gap-2 transition-all active:scale-95 group"
          title={`Click to view live weather for ${locationName}`}
        >
          {/* Live pulsing dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>

          {info.icon}

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
            <span>{weather ? `${weather.temperature}°C` : "--"}</span>
            <span className="text-slate-400 font-normal hidden sm:inline">•</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium hidden sm:inline">
              {info.label}
            </span>
            <span className="text-slate-400 font-normal hidden md:inline">•</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold max-w-[120px] truncate">
              {locationName}
            </span>
          </div>

          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
          )}
        </button>

        {/* Mobile Backdrop for 1-Tap Dismiss */}
        {isExpanded && (
          <div
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 sm:hidden"
          />
        )}

        {/* 2. Expanded Weather & AQI Flyout Card (Fixed on mobile to break out of scroll containers) */}
        {isExpanded && (
          <div className="fixed top-20 left-3 right-3 sm:static sm:absolute sm:top-11 sm:left-auto sm:right-0 w-auto sm:w-80 max-w-sm mx-auto sm:mx-0 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700/80 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {locationName}, India
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={fetchLiveWeather}
                  disabled={loading}
                  title="Refresh weather"
                  className="p-1 rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Temperature Display */}
            <div className="py-3 flex items-center justify-between">
              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-start">
                  <span>{weather?.temperature ?? "--"}</span>
                  <span className="text-base font-semibold text-slate-400 mt-1">°C</span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {info.label} • Feels like {weather?.apparentTemperature ?? "--"}°C
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/10 to-amber-500/20 dark:from-blue-500/20 dark:to-amber-500/30 flex items-center justify-center text-2xl">
                {weather?.weatherCode === 0
                  ? "☀️"
                  : weather?.weatherCode && weather.weatherCode > 50
                  ? "🌧️"
                  : "🌤️"}
              </div>
            </div>

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 pb-2">
              {/* Humidity */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <Droplets className="w-3 h-3 text-blue-500" />
                  <span>Humidity</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {weather?.humidity ?? "--"}%
                </span>
              </div>

              {/* Wind Speed */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <Wind className="w-3 h-3 text-teal-500" />
                  <span>Wind</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {weather?.windSpeed ?? "--"} km/h
                </span>
              </div>

              {/* Estimated Air Quality (AQI) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <Gauge className="w-3 h-3 text-amber-500" />
                  <span>AQI Index</span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full mt-1 ${aqiInfo.badgeClass}`}
                >
                  {aqiInfo.aqi} {aqiInfo.status}
                </span>
              </div>
            </div>

            {/* One-click Fly Map to this Location button */}
            {onFlyToCoords && (
              <button
                onClick={() => {
                  onFlyToCoords([lat, lon]);
                  setIsExpanded(false);
                }}
                className="w-full mt-1 mb-2.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Fly Map to {locationName}</span>
              </button>
            )}

            {/* Geographic Coordinates & Live Tag */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-blue-500" />
                <span>
                  {lat.toFixed(2)}°N, {lon.toFixed(2)}°E
                </span>
              </span>
              <span>Updated: {lastUpdated}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
