import { useEffect, useRef } from "react";
import { MapPin, Navigation, Building2 } from "lucide-react";

export default function StayAnchorMap({ selectedStay, dayItems = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const stayLat = selectedStay?.latitude || 15.498;
  const stayLng = selectedStay?.longitude || 73.827;
  const stayName = selectedStay?.stay_name || selectedStay?.name || "Your Stay Anchor";

  useEffect(() => {
    // Load Leaflet CSS dynamically if not already loaded
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS dynamically if not already loaded
    function initLeafletMap() {
      if (!window.L || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = window.L.map(mapContainerRef.current).setView([stayLat, stayLng], 12);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      // 1. Custom Stay Marker (Pine / Gold)
      const stayIcon = window.L.divIcon({
        className: "custom-stay-icon",
        html: `<div style="background-color: #1A362B; color: #EED7A1; padding: 8px 12px; border-radius: 20px; font-weight: bold; font-size: 11px; border: 2px solid #C47849; box-shadow: 0 4px 12px rgba(0,0,0,0.3); white-space: nowrap;">🏠 ${stayName}</div>`,
        iconSize: [120, 30],
        iconAnchor: [60, 15]
      });

      window.L.marker([stayLat, stayLng], { icon: stayIcon })
        .addTo(map)
        .bindPopup(`<b>${stayName}</b><br/>Base Stay Anchor`)
        .openPopup();

      // 2. Add POI Markers for scheduled items
      const bounds = window.L.latLngBounds([[stayLat, stayLng]]);

      dayItems.forEach((item, idx) => {
        const lat = item.latitude || (stayLat + (idx + 1) * 0.012);
        const lng = item.longitude || (stayLng + (idx + 1) * 0.012);

        bounds.extend([lat, lng]);

        const itemType = (item.type || item.item_type || "place").toLowerCase();
        let iconEmoji = "📍";
        let bgColor = "#2B4C3F";

        if (itemType === "restaurant") {
          iconEmoji = "🍽️";
          bgColor = "#C47849";
        } else if (itemType === "activity") {
          iconEmoji = "🎟️";
          bgColor = "#3B82F6";
        }

        const poiIcon = window.L.divIcon({
          className: "custom-poi-icon",
          html: `<div style="background-color: ${bgColor}; color: #ffffff; padding: 4px 8px; border-radius: 14px; font-weight: 600; font-size: 10px; border: 1.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.2); white-space: nowrap;">${iconEmoji} ${item.name || "POI"}</div>`,
          iconSize: [100, 24],
          iconAnchor: [50, 12]
        });

        const distText = item.distance_from_stay_km
          ? `<br/>Dist: ${item.distance_from_stay_km} km`
          : "";

        window.L.marker([lat, lng], { icon: poiIcon })
          .addTo(map)
          .bindPopup(`<b>${item.name}</b><br/>${item.category || itemType}${distText}`);
      });

      if (dayItems.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    if (window.L) {
      initLeafletMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initLeafletMap;
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedStay, dayItems, stayLat, stayLng, stayName]);

  return (
    <div className="rounded-2xl border border-sand bg-paper p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-pine" />
          <h3 className="font-display text-sm font-bold text-ink">
            Stay Anchor Map (OpenStreetMap / Leaflet)
          </h3>
        </div>
        <span className="rounded-full bg-pine/10 px-2.5 py-0.5 text-[10px] font-semibold text-pine">
          {selectedStay ? selectedStay.stay_name : "Stay Anchored"}
        </span>
      </div>

      <div
        ref={mapContainerRef}
        className="h-64 w-full rounded-xl border border-sand/80 bg-cream/50 z-0"
        style={{ minHeight: "260px" }}
      />

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-ink-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-pine" /> Stay Anchor
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-copper" /> Restaurant
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> Activity
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-pine-dark" /> Attraction
        </span>
      </div>
    </div>
  );
}
