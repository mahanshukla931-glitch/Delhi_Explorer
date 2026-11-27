"use client";

import React, { useEffect, useState } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { DistrictProperties } from "@/types/geojson";
import type { Feature } from "geojson";

interface DelhiDistrictsGeoJsonProps {
  visible: boolean;
  activeMetric: "density" | "population" | "literacyRate" | "areaKm2";
  onSelectDistrict: (props: DistrictProperties | null) => void;
  isDarkMode?: boolean;
}

export function DelhiDistrictsGeoJson({
  visible,
  activeMetric,
  onSelectDistrict,
  isDarkMode = false,
}: DelhiDistrictsGeoJsonProps) {
  const map = useMap();
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/data/delhi_districts.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error fetching Delhi GeoJSON:", err));
  }, []);

  if (!visible || !geoData) return null;

  // Choropleth color calculation based on selected demographic metric
  const getColor = (value: number, metric: "density" | "population" | "literacyRate" | "areaKm2") => {
    if (metric === "density") {
      // Density people/km2
      return value > 25000
        ? "#800026"
        : value > 20000
        ? "#BD0026"
        : value > 15000
        ? "#E31A1C"
        : value > 10000
        ? "#FC4E2A"
        : value > 5000
        ? "#FD8D3C"
        : "#FEB24C";
    } else if (metric === "population") {
      // Population
      return value > 3000000
        ? "#4a1486"
        : value > 2500000
        ? "#6a51a3"
        : value > 2000000
        ? "#807dba"
        : value > 1500000
        ? "#9e9ac8"
        : value > 1000000
        ? "#bcbddc"
        : "#dadaeb";
    } else if (metric === "literacyRate") {
      // Literacy Rate %
      return value > 88
        ? "#005a32"
        : value > 87
        ? "#238b45"
        : value > 86
        ? "#41ab5d"
        : value > 85
        ? "#74c476"
        : "#a1d99b";
    } else {
      // Area in km2
      return value > 400
        ? "#08519c"
        : value > 250
        ? "#3182bd"
        : value > 100
        ? "#6baed6"
        : value > 50
        ? "#9ecae1"
        : "#c6dbef";
    }
  };

  const styleFeature = (feature?: Feature) => {
    if (!feature) return {};
    const props = feature.properties as unknown as DistrictProperties;
    const val = props[activeMetric] || 0;

    return {
      fillColor: getColor(val, activeMetric),
      weight: 2,
      opacity: 0.95,
      color: isDarkMode ? "#38bdf8" : "#ffffff",
      dashArray: "3",
      fillOpacity: isDarkMode ? 0.45 : 0.55,
    };
  };

  const onEachFeature = (feature: Feature, layer: L.Layer) => {
    const props = feature.properties as unknown as DistrictProperties;

    // Hover Highlight & Click
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 4,
          color: "#3b82f6",
          dashArray: "",
          fillOpacity: 0.8,
        });
        l.bringToFront();
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(styleFeature(feature));
      },
      click: (e) => {
        onSelectDistrict(props);
        const l = e.target;
        if (l.getBounds) {
          map.fitBounds(l.getBounds(), { padding: [60, 60], maxZoom: 13 });
        }
      },
    });

    // Tooltip
    const metricLabel =
      activeMetric === "density"
        ? `Density: ${props.density?.toLocaleString()} /km²`
        : activeMetric === "population"
        ? `Population: ${props.population?.toLocaleString()}`
        : activeMetric === "literacyRate"
        ? `Literacy: ${props.literacyRate}%`
        : `Area: ${props.areaKm2} km²`;

    layer.bindTooltip(
      `<div style="font-family: system-ui, sans-serif; font-size: 11px;">
        <strong>${props.name}</strong> (${props.hindiName})<br/>
        <span style="color: #2563eb; font-weight: 600;">${metricLabel}</span><br/>
        <span style="color: #64748b; font-size: 10px;">HQ: ${props.headquarters}</span>
      </div>`,
      { sticky: true, className: "custom-district-tooltip" }
    );
  };

  return (
    <GeoJSON
      key={`${activeMetric}-${isDarkMode ? "dark" : "light"}-${geoData.features.length}`}
      data={geoData}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
}
