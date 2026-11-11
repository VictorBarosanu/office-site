// apps/web/src/EntranceMap.tsx — the entrances as pins on a map (MapLibre GL JS)
import type { Entrance, SurveyStatus } from "field-app-contract/contract";
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  Popup,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// the map draws its tiles in a Web Worker; Vite bundles it and gives its URL
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { useEffect, useRef } from "react";

setWorkerUrl(workerUrl);

// free vector tiles from OpenStreetMap data, no key needed
const STYLE = "https://tiles.openfreemap.org/styles/liberty";

export const STATUS_COLOUR: Record<SurveyStatus, string> = {
  approved: "#15803d",
  in_progress: "#d97706",
  needs_rework: "#dc2626",
  not_started: "#6b7280",
  submitted: "#2563eb",
};

export function EntranceMap({ entrances }: { entrances: Entrance[] }) {
  const container = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!container.current || entrances.length === 0) {
      return;
    }
    // one bounding box around every pin: the map opens on all of them
    const bounds = new LngLatBounds();
    for (const e of entrances) {
      bounds.extend([e.lng, e.lat]);
    }
    const map = new MapLibreMap({
      bounds,
      container: container.current,
      fitBoundsOptions: { maxZoom: 16, padding: 40 },
      style: STYLE,
    });
    for (const e of entrances) {
      new Marker({ color: STATUS_COLOUR[e.surveyStatus] })
        .setLngLat([e.lng, e.lat]) // MapLibre wants longitude first
        // setText, never setHTML: an address is data, not markup
        .setPopup(
          new Popup({ offset: 25 }).setText(
            `${e.street} ${e.number}, ${e.entranceName}: ${e.surveyStatus}`
          )
        )
        .addTo(map);
    }
    // React removes the section: free the WebGL context and the worker with it
    return () => map.remove();
  }, [entrances]);

  return (
    <section
      aria-label="Map of the entrances"
      className="map"
      ref={container}
    />
  );
}
