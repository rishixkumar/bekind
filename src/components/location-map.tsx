"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LocationMapProps = {
  lat: number;
  lng: number;
};

function Recenter({ lat, lng }: LocationMapProps) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

function youAreHereIcon() {
  return L.divIcon({
    className: "bk-you-are-here-icon",
    html: `<span class="bk-you-are-here-dot" aria-hidden="true"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

export function LocationMap({ lat, lng }: LocationMapProps) {
  const icon = useMemo(() => youAreHereIcon(), []);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom
      className="bk-map h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={lat} lng={lng} />
      <Marker position={[lat, lng]} icon={icon}>
        <Popup>You are here</Popup>
      </Marker>
    </MapContainer>
  );
}
