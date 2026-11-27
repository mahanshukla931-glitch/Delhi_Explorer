"use client";

import { useMapEvents } from "react-leaflet";

interface MapEventsHandlerProps {
  onMoveEnd: (center: [number, number], zoom: number) => void;
  onMouseMove: (coords: [number, number]) => void;
}

export function MapEventsHandler({ onMoveEnd, onMouseMove }: MapEventsHandlerProps) {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      onMoveEnd([center.lat, center.lng], map.getZoom());
    },
    mousemove: (e) => {
      onMouseMove([e.latlng.lat, e.latlng.lng]);
    },
  });

  return null;
}
