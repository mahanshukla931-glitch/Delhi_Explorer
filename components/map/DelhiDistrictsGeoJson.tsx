"use client";

import React, { useEffect, useState } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { DistrictProperties } from "@/types/geojson";
import type { Feature } from "geojson";

interface DelhiDistrictsGeoJsonProps {
  visible: boolean;
  activeMetric: "density" | "population" | "literacyRate";
  onSelectDistrict: (props: DistrictProperties | null) => void;
}

export function DelhiDistrictsGeoJson({
  visible,
  activeMetric,
  onSelectDistrict,
}: DelhiDistrictsGeoJsonProps) {
  const map = useMap();
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/data/delhi_districts.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error fetching Delhi GeoJSON:", err));
  }, []);

  if (!visible || !geoData) return null;

  // Choropleth color calculation based on metric
  const getColor = (value: number, metric: "density" | "population" | "literacyRate") => {
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
    } else {
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
    }
  };

  const styleFeature = (feature?: Feature) => {
    if (!feature) return {};
    const props = feature.properties as unknown as DistrictProperties;
    const val = props[activeMetric] || 0;

    return {
      fillColor: getColor(val, activeMetric),
      weight: 2,
      opacity: 0.9,
      color: "#ffffff",
      dashArray: "3",
      fillOpacity: 0.55,
    };
  };

  const onEachFeature = (feature: Feature, layer: L.Layer) => {
    const props = feature.properties as unknown as DistrictProperties;

    // Hover Highlight
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 4,
          color: "#2563eb",
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
        map.fitBounds(l.getBounds(), { padding: [50, 50], maxZoom: 13 });
      },
    });

    // Tooltip
    layer.bindTooltip(
      `<strong>${props.name}</strong><br/>${props.hindiName}<br/>Density: ${props.density.toLocaleString()} /km²`,
      { sticky: true, className: "google-maps-tooltip" }
    );
  };

  return (
    <GeoJSON
      key={`${activeMetric}-${geoData.features.length}`}
      data={geoData}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
}
