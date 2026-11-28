/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import {
  StoredShape,
  loadSavedShapes,
  saveShape,
  deleteShape,
} from "@/lib/shapesStorage";

// Geodesic Area Calculation for Polygons (Spherical Excess formula)
function computePolygonArea(latLngs: L.LatLng[]): number {
  const RADIUS = 6378137; // Earth radius in meters
  if (latLngs.length < 3) return 0;
  let total = 0;

  for (let i = 0; i < latLngs.length; i++) {
    const p1 = latLngs[i];
    const p2 = latLngs[(i + 1) % latLngs.length];
    const rad1 = (p1.lat * Math.PI) / 180;
    const rad2 = (p2.lat * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    total += dLng * (2 + Math.sin(rad1) + Math.sin(rad2));
  }

  return Math.abs((total * RADIUS * RADIUS) / 2);
}

// Distance Calculation for Polylines
function computeLineDistance(latLngs: L.LatLng[]): number {
  let total = 0;
  for (let i = 0; i < latLngs.length - 1; i++) {
    total += latLngs[i].distanceTo(latLngs[i + 1]);
  }
  return total;
}

export function GeomanDrawLayer({
  enabled = true,
  activeColor = "#3b82f6",
}: {
  enabled?: boolean;
  activeColor?: string;
}) {
  const map = useMap();
  const drawnLayersRef = useRef<Map<string, L.Layer>>(new Map());
  const activeColorRef = useRef(activeColor);

  useEffect(() => {
    activeColorRef.current = activeColor;
    if (map && (map as any).pm?.setPathOptions) {
      (map as any).pm.setPathOptions({
        color: activeColor,
        fillColor: activeColor,
        fillOpacity: 0.25,
      });
    }
  }, [activeColor, map]);

  // Attach shape popup with formatted measurement and Delete action
  const attachShapePopup = (layer: any, shape: StoredShape) => {
    let measurementText = "";
    if (shape.measurements?.areaText) {
      measurementText += `<div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>📐 Area:</span><b style="color:#0f172a">${shape.measurements.areaText}</b></div>`;
    }
    if (shape.measurements?.distanceText) {
      measurementText += `<div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>📏 Length:</span><b style="color:#0f172a">${shape.measurements.distanceText}</b></div>`;
    }
    if (shape.measurements?.radiusMeters) {
      measurementText += `<div style="display:flex; justify-content:space-between; margin-bottom:2px;"><span>⭕ Radius:</span><b style="color:#0f172a">${shape.measurements.radiusMeters} m</b></div>`;
    }

    const popupHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 180px; padding: 4px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #2563eb; letter-spacing: 0.5px;">
            ${shape.type}
          </span>
          <span style="font-size: 10px; color: #64748b;">Saved</span>
        </div>
        <div style="font-size: 11.5px; line-height: 1.4; color: #334155; margin-bottom: 8px;">
          ${measurementText || "Drawn Shape"}
        </div>
        <button id="del-shape-${shape.id}" style="width: 100%; padding: 5px 8px; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s;">
          🗑️ Delete Shape
        </button>
      </div>
    `;

    layer.bindPopup(popupHtml);
    layer.on("popupopen", () => {
      const btn = document.getElementById(`del-shape-${shape.id}`);
      if (btn) {
        btn.onclick = () => {
          deleteShape(shape.id);
          map.removeLayer(layer);
          drawnLayersRef.current.delete(shape.id);
        };
      }
    });
  };

  // 1. Initial Load of Saved Shapes from LocalStorage (survives page refresh & syncs on events)
  useEffect(() => {
    if (!map) return;
    if (typeof window !== "undefined") {
      (window as any).delhiMap = map;
    }

    // Ensure map.pm is initialized immediately
    if (!(map as any).pm && (L as any).PM?.Map) {
      (map as any).pm = new (L as any).PM.Map(map);
      (map as any).pm.setGlobalOptions({});
    }

    const renderStoredShapes = () => {
      // Clear any previous references
      drawnLayersRef.current.forEach((layer) => {
        try {
          map.removeLayer(layer);
        } catch {}
      });
      drawnLayersRef.current.clear();

      const existingShapes = loadSavedShapes();
      existingShapes.forEach((s) => {
        try {
          let l: any;
          const shapeColor = s.color || "#3b82f6";
          if (s.type === "marker") {
            l = L.marker(s.coordinates as [number, number]);
          } else if (s.type === "circle") {
            const c = s.coordinates as { center: [number, number]; radius: number };
            l = L.circle(c.center, {
              radius: c.radius,
              color: shapeColor,
              fillColor: shapeColor,
              fillOpacity: 0.25,
            });
          } else if (s.type === "polyline" || (s.type as string) === "line") {
            l = L.polyline(s.coordinates as [number, number][], {
              color: shapeColor,
              weight: 4,
            });
          } else if (s.type === "polygon" || s.type === "rectangle") {
            l = L.polygon(s.coordinates as [number, number][], {
              color: shapeColor,
              fillColor: shapeColor,
              fillOpacity: 0.25,
              weight: 3,
            });
          }

          if (l) {
            l.addTo(map);
            (l as any)._shapeId = s.id;
            drawnLayersRef.current.set(s.id, l);
            attachShapePopup(l, s);
          }
        } catch (err) {
          console.error("Failed to render stored shape:", err);
        }
      });
    };

    renderStoredShapes();

    window.addEventListener("delhi_shapes_changed", renderStoredShapes);
    return () => window.removeEventListener("delhi_shapes_changed", renderStoredShapes);
  }, [map]);

  // 2. Toolbar controls and create/edit/delete event listeners
  useEffect(() => {
    if (!map) return;

    if (!(map as any).pm && (L as any).PM?.Map) {
      (map as any).pm = new (L as any).PM.Map(map);
      (map as any).pm.setGlobalOptions({});
    }

    const pm = (map as any).pm;
    if (!pm) return;

    if (!enabled) {
      try {
        if (pm.disableDraw) pm.disableDraw();
        if (pm.globalEditModeEnabled && pm.globalEditModeEnabled()) pm.disableGlobalEditMode();
        if (pm.globalRemovalModeEnabled && pm.globalRemovalModeEnabled()) pm.disableGlobalRemovalMode();
        if (pm.removeControls) pm.removeControls();
      } catch {}
      return;
    }

    pm.setPathOptions({
      color: activeColorRef.current,
      fillColor: activeColorRef.current,
      fillOpacity: 0.25,
    });

    // Handle Create Shape Event
    const handleCreate = (e: any) => {
      const shapeType = e.shape?.toLowerCase();
      const layer = e.layer;
      const id = "shape-" + Date.now();
      (layer as any)._shapeId = id;

      let coords: any = null;
      let measurements: any = {};

      if (shapeType === "marker") {
        coords = [layer.getLatLng().lat, layer.getLatLng().lng];
      } else if (shapeType === "circle") {
        const center = layer.getLatLng();
        const radius = Math.round(layer.getRadius());
        coords = { center: [center.lat, center.lng], radius };
        const area = Math.round(Math.PI * radius * radius);
        measurements = {
          radiusMeters: radius,
          areaMeters: area,
          areaText: area > 1000000 ? `${(area / 1000000).toFixed(2)} km²` : `${area.toLocaleString()} m²`,
        };
      } else if (shapeType === "line" || shapeType === "polyline") {
        const latLngs = layer.getLatLngs();
        coords = latLngs.map((pt: any) => [pt.lat, pt.lng]);
        const dist = Math.round(computeLineDistance(latLngs));
        measurements = {
          distanceMeters: dist,
          distanceText: dist > 1000 ? `${(dist / 1000).toFixed(2)} km` : `${dist} m`,
        };
      } else if (shapeType === "polygon" || shapeType === "rectangle") {
        const rawLatLngs = layer.getLatLngs();
        const latLngs = Array.isArray(rawLatLngs[0]) ? rawLatLngs[0] : rawLatLngs;
        coords = latLngs.map((pt: any) => [pt.lat, pt.lng]);
        const area = Math.round(computePolygonArea(latLngs));
        const dist = Math.round(computeLineDistance([...latLngs, latLngs[0]]));
        measurements = {
          areaMeters: area,
          areaText: area > 1000000 ? `${(area / 1000000).toFixed(2)} km²` : `${area.toLocaleString()} m²`,
          distanceMeters: dist,
          distanceText: `Perimeter: ${dist > 1000 ? `${(dist / 1000).toFixed(2)} km` : `${dist} m`}`,
        };
      }

      const stored: StoredShape = {
        id,
        type: shapeType,
        coordinates: coords,
        measurements,
        color: activeColorRef.current,
        createdAt: Date.now(),
      };

      saveShape(stored);
      drawnLayersRef.current.set(id, layer);
      attachShapePopup(layer, stored);

      // Reset draw mode in floating bar & disable draw mode
      window.dispatchEvent(new Event("delhi_draw_reset"));
      if (pm.disableDraw) pm.disableDraw();
      if (map.getContainer()) map.getContainer().style.cursor = "";
    };

    // Handle Edit Shape Event (Persistence)
    const handleEdit = (e: any) => {
      const layer = e.layer;
      const id = (layer as any)._shapeId;
      if (!id) return;

      const existing = loadSavedShapes().find((s) => s.id === id);
      if (!existing) return;

      if (existing.type === "marker") {
        existing.coordinates = [layer.getLatLng().lat, layer.getLatLng().lng];
      } else if (existing.type === "circle") {
        const radius = Math.round(layer.getRadius());
        const center: [number, number] = [layer.getLatLng().lat, layer.getLatLng().lng];
        existing.coordinates = { center, radius };
        const area = Math.round(Math.PI * radius * radius);
        existing.measurements = {
          radiusMeters: radius,
          areaMeters: area,
          areaText: area > 1000000 ? `${(area / 1000000).toFixed(2)} km²` : `${area.toLocaleString()} m²`,
        };
      } else if (existing.type === "polyline" || existing.type === "line") {
        const latLngs = layer.getLatLngs();
        existing.coordinates = latLngs.map((pt: any) => [pt.lat, pt.lng]);
        const dist = Math.round(computeLineDistance(latLngs));
        existing.measurements = {
          distanceMeters: dist,
          distanceText: dist > 1000 ? `${(dist / 1000).toFixed(2)} km` : `${dist} m`,
        };
      } else if (existing.type === "polygon" || existing.type === "rectangle") {
        const raw = layer.getLatLngs();
        const latLngs = Array.isArray(raw[0]) ? raw[0] : raw;
        existing.coordinates = latLngs.map((pt: any) => [pt.lat, pt.lng]);
        const area = Math.round(computePolygonArea(latLngs));
        const dist = Math.round(computeLineDistance([...latLngs, latLngs[0]]));
        existing.measurements = {
          areaMeters: area,
          areaText: area > 1000000 ? `${(area / 1000000).toFixed(2)} km²` : `${area.toLocaleString()} m²`,
          distanceMeters: dist,
          distanceText: `Perimeter: ${dist > 1000 ? `${(dist / 1000).toFixed(2)} km` : `${dist} m`}`,
        };
      }

      saveShape(existing);
      attachShapePopup(layer, existing);
    };

    // Handle Remove Event
    const handleRemove = (e: any) => {
      const id = (e.layer as any)._shapeId;
      if (id) {
        deleteShape(id);
        drawnLayersRef.current.delete(id);
      }
    };

    // Listen to custom drawing tool trigger events from DrawToolsFloatingBar
    const handleToolTrigger = (e: any) => {
      const mode = e.detail?.mode;
      if (!pm) return;

      if (mode === "finish") {
        try {
          if (pm.Draw?.Polygon?.finish) pm.Draw.Polygon.finish();
          else if (pm.Draw?.Line?.finish) pm.Draw.Line.finish();
          else if (pm.finishDraw) pm.finishDraw();
        } catch (err) {
          console.warn("Geoman finishDraw error:", err);
        }
        return;
      }

      try {
        if (pm.disableDraw) pm.disableDraw();
        if (pm.globalEditModeEnabled && pm.globalEditModeEnabled()) pm.disableGlobalEditMode();
        if (pm.globalRemovalModeEnabled && pm.globalRemovalModeEnabled()) pm.disableGlobalRemovalMode();
        if (map.getContainer()) map.getContainer().style.cursor = "";
      } catch (err) {
        console.warn("Geoman reset warning:", err);
      }

      if (!mode || mode === "none") return;

      if (map.getContainer()) map.getContainer().style.cursor = "crosshair";

      pm.setPathOptions({
        color: activeColorRef.current,
        fillColor: activeColorRef.current,
        fillOpacity: 0.25,
      });

      try {
        if (mode === "polygon") {
          pm.enableDraw("Polygon", { finishOn: "dblclick", snappable: true });
        } else if (mode === "line") {
          pm.enableDraw("Line", { finishOn: "dblclick", snappable: true });
        } else if (mode === "circle") {
          pm.enableDraw("Circle");
        } else if (mode === "rectangle") {
          pm.enableDraw("Rectangle");
        } else if (mode === "marker") {
          pm.enableDraw("Marker");
        } else if (mode === "edit") {
          pm.enableGlobalEditMode();
        } else if (mode === "erase") {
          pm.enableGlobalRemovalMode();
        }
      } catch (err) {
        console.error("Geoman enable mode error:", err);
      }
    };

    // Listen to color changes
    const handleColorChange = (e: any) => {
      const color = e.detail?.color;
      if (color) {
        activeColorRef.current = color;
        if (pm?.setPathOptions) {
          pm.setPathOptions({
            color,
            fillColor: color,
            fillOpacity: 0.25,
          });
        }
      }
    };

    window.addEventListener("delhi_draw_tool_trigger", handleToolTrigger);
    window.addEventListener("delhi_draw_color_change", handleColorChange);
    map.on("pm:create", handleCreate);
    map.on("pm:edit", handleEdit);
    map.on("pm:remove", handleRemove);

    return () => {
      window.removeEventListener("delhi_draw_tool_trigger", handleToolTrigger);
      window.removeEventListener("delhi_draw_color_change", handleColorChange);
      try {
        map.off("pm:create", handleCreate);
        map.off("pm:edit", handleEdit);
        map.off("pm:remove", handleRemove);
        if (pm.disableDraw) pm.disableDraw();
        if (pm.globalEditModeEnabled && pm.globalEditModeEnabled()) pm.disableGlobalEditMode();
        if (pm.globalRemovalModeEnabled && pm.globalRemovalModeEnabled()) pm.disableGlobalRemovalMode();
        if (pm.removeControls) pm.removeControls();
      } catch {}
    };
  }, [map, enabled]);

  return null;
}
