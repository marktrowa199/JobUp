"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";

export type MapJob = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  description?: string;
};

type LocationState = "idle" | "locating" | "located" | "denied" | "unavailable";

const worldView: [number, number] = [20, 0];

export function LocationMap({ jobs = [] }: { jobs?: MapJob[] }) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const locationMarkerRef = useRef<Leaflet.Marker | null>(null);
  const accuracyCircleRef = useRef<Leaflet.Circle | null>(null);
  const jobLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [locationMessage, setLocationMessage] = useState("Use your location to center the map near you.");

  const locateUser = useCallback(() => {
    const map = mapRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet) {
      return;
    }

    if (!navigator.geolocation) {
      setLocationState("unavailable");
      setLocationMessage("Location services are not available in this browser.");
      return;
    }

    setLocationState("locating");
    setLocationMessage("Requesting your current location...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position: [number, number] = [coords.latitude, coords.longitude];
        const markerIcon = leaflet.divIcon({
          className: "jobup-location-marker-wrap",
          html: '<span class="jobup-location-marker" aria-hidden="true"></span>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        locationMarkerRef.current?.remove();
        accuracyCircleRef.current?.remove();
        locationMarkerRef.current = leaflet.marker(position, { icon: markerIcon, alt: "Your current location" }).addTo(map);
        accuracyCircleRef.current = leaflet.circle(position, {
          radius: Math.min(coords.accuracy || 250, 5000),
          color: "#4f46e5",
          fillColor: "#818cf8",
          fillOpacity: 0.14,
          weight: 1,
        }).addTo(map);
        map.setView(position, Math.max(map.getZoom(), 13), { animate: true });
        setLocationState("located");
        setLocationMessage("Your current location is shown on the map.");
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED;
        setLocationState(denied ? "denied" : "unavailable");
        setLocationMessage(denied ? "Location access was denied. You can still explore the map." : "We could not determine your location. Please try again.");
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!mapElementRef.current || mapRef.current) {
        return;
      }

      try {
        const leafletModule = await import("leaflet");
        const leaflet = leafletModule.default ?? leafletModule;
        if (cancelled || !mapElementRef.current) {
          return;
        }

        const map = leaflet.map(mapElementRef.current, {
          zoomControl: false,
          attributionControl: true,
          scrollWheelZoom: true,
        }).setView(worldView, 2);
        leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        }).addTo(map);
        leaflet.control.zoom({ position: "bottomright" }).addTo(map);
        mapRef.current = map;
        leafletRef.current = leaflet;
        jobLayerRef.current = leaflet.layerGroup().addTo(map);
        setIsMapReady(true);
        map.invalidateSize();
      } catch {
        setLocationState("unavailable");
        setLocationMessage("The map could not load right now. You can continue using JobUp without it.");
      }
    }

    void initializeMap();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const leaflet = leafletRef.current;
    const jobLayer = jobLayerRef.current;
    if (!map || !leaflet || !jobLayer) {
      return;
    }

    jobLayer.clearLayers();
    jobs.forEach((job) => {
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = job.title;
      popup.append(title);
      if (job.description) {
        popup.append(document.createElement("br"), document.createTextNode(job.description));
      }
      const marker = leaflet.marker([job.latitude, job.longitude]).bindPopup(popup);
      marker.addTo(jobLayer);
    });
  }, [jobs, isMapReady]);

  return (
    <section className="border-b border-slate-200 bg-white" aria-labelledby="location-map-heading">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-indigo-600">Find your bearings</p>
            <h2 id="location-map-heading" className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">See opportunities in context.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Use your current location as a starting point for exploring the places and opportunities around you.</p>
          </div>
          <button type="button" onClick={locateUser} disabled={!isMapReady || locationState === "locating"} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300">
            <span aria-hidden="true">⌖</span>
            {locationState === "locating" ? "Locating..." : "Use My Location"}
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-[0_20px_55px_-35px_rgba(30,41,59,0.5)]">
          <div ref={mapElementRef} className="jobup-map h-[280px] w-full sm:h-[360px] lg:h-[420px]" aria-label="Interactive map showing your current location" />
          <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-5 py-3 text-sm text-slate-600">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${locationState === "located" ? "bg-emerald-500" : locationState === "denied" || locationState === "unavailable" ? "bg-amber-500" : "bg-slate-300"}`} aria-hidden="true" />
            <span>{locationMessage}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
