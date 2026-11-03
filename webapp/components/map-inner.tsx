"use client";

import { useEffect } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

function ClickPicker({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapInner({
  lat, lng, radius, name, pick, onPick,
}: {
  lat: number;
  lng: number;
  radius: number;
  name: string;
  pick?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
}) {
  useEffect(() => {
    // fix default marker icons in Next
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Circle center={[lat, lng]} radius={radius} pathOptions={{ color: "#0C5B40", dashArray: "7 6", fillOpacity: 0.08 }} />
      <Marker position={[lat, lng]} />
      {pick && <Marker position={[pick.lat, pick.lng]} opacity={0.7} />}
      <ClickPicker onPick={onPick} />
    </MapContainer>
  );
}
