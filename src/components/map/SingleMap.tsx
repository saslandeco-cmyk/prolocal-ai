"use client";
import { useEffect, useRef } from "react";

interface SingleMapProps {
  lat: number;
  lng: number;
  name: string;
  address: string;
  logo?: string;
}

export default function SingleMap({ lat, lng, name, address, logo }: SingleMapProps) {
  const mapRef        = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

      const innerContent = logo
        ? `<img src="${logo}" alt="${name}" style="
            width:26px;height:26px;
            border-radius:50%;
            object-fit:cover;
            display:block;
          " />`
        : `<span style="
            color:white;font-size:10px;font-weight:bold;
            font-family:Inter,sans-serif;
            line-height:1;
          ">${initials}</span>`;

      const icon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:36px;height:36px;">
          <div style="
            width:36px;height:36px;
            background:linear-gradient(135deg,#2D5A3D,#1A3A2A);
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
          "></div>
          <div style="
            position:absolute;top:5px;left:5px;
            width:26px;height:26px;
            display:flex;align-items:center;justify-content:center;
            overflow:hidden;
            border-radius:50%;
          ">${innerContent}</div>
        </div>`,
        iconSize:   [36, 36],
        iconAnchor: [18, 36],
        popupAnchor:[0, -40],
      });

      const popup = L.popup({ maxWidth: 200, closeButton: false, autoPan: false })
        .setContent(`<b style="color:#1A3A2A">${name}</b><br><small>${address}</small>`);

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(popup)
        .openPopup(); // Ouverte par défaut sur la fiche

      // Réouvrir au survol si fermée
      marker.on("mouseover", () => marker.openPopup());
      marker.on("mouseout", () => {
        setTimeout(() => {
          const popupEl = marker.getPopup()?.getElement();
          if (!popupEl?.matches(":hover") && !marker.getElement()?.matches(":hover")) {
            marker.closePopup();
          }
        }, 300);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, name, address, logo]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: 240 }} />
    </>
  );
}
