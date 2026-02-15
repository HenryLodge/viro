"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Hospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  available_beds: number;
  wait_time_minutes: number;
  address: string | null;
}

interface HospitalMapProps {
  hospitals: Hospital[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function HospitalMap({
  hospitals,
  selectedId,
  onSelect,
}: HospitalMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || hospitals.length === 0) return;

    // Create map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false,
      });

      const tileUrl =
        process.env.NEXT_PUBLIC_MAP_TILE_URL ??
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      L.tileLayer(tileUrl, {
        maxZoom: 18,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add markers for each hospital
    const bounds = L.latLngBounds([]);

    hospitals.forEach((h, i) => {
      const isSelected = h.id === selectedId;

      // Custom icon
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: ${isSelected ? "32px" : "26px"};
          height: ${isSelected ? "32px" : "26px"};
          border-radius: 50%;
          background: ${isSelected ? "hsl(195,65%,48%)" : "hsl(218,50%,20%)"};
          border: 2px solid ${isSelected ? "white" : "hsl(195,65%,48%)"};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${isSelected ? "white" : "hsl(195,65%,55%)"};
          font-weight: bold;
          font-size: ${isSelected ? "14px" : "12px"};
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          transition: all 0.2s;
        ">${i + 1}</div>`,
        iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
        iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
      });

      const marker = L.marker([h.lat, h.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-size:13px;line-height:1.5;">
            <b>${h.name}</b><br/>
            ${h.address ?? ""}<br/>
            <span style="color:#888;">Beds: ${h.available_beds} | Wait: ~${h.wait_time_minutes}m</span>
          </div>`,
          { className: "custom-popup" }
        );

      marker.on("click", () => onSelect(h.id));
      markersRef.current.push(marker);
      bounds.extend([h.lat, h.lng]);
    });

    // Fit map to bounds
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }

    return () => {
      // Don't destroy map on cleanup, just clear markers on next render
    };
  }, [hospitals, selectedId, onSelect]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: "200px" }}
    />
  );
}
