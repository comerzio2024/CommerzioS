import { useEffect, useRef, useState, useCallback } from "react";
import type { ServiceWithDetails } from "@/lib/api";
import { geocodeLocation } from "@/lib/geocoding";

interface GoogleMapsProps {
  services: (ServiceWithDetails & { distance?: number })[];
  userLocation: { lat: number; lng: number; name: string } | null;
  maxServices?: number;
  apiKey?: string;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

interface GoogleMapsWindow extends Window {
  google?: any;
}

interface FuzzyPoint {
  service: ServiceWithDetails & { distance?: number };
  lat: number;
  lng: number;
}

export function GoogleMaps({
  services,
  userLocation,
  apiKey,
  isExpanded,
}: GoogleMapsProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowsRef = useRef<any[]>([]);
  const currentInfoWindowRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const [currentZoom, setCurrentZoom] = useState(12);

  const getGridSize = (zoom: number): number => {
    if (zoom >= 15) return 0.002;
    if (zoom >= 13) return 0.004;
    if (zoom >= 11) return 0.008;
    return 0.015;
  };

  const getFuzzyLocation = useCallback((lat: number, lng: number, id: string): { lat: number; lng: number } => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash) / 2147483647;
    const offsetLat = (seed - 0.5) * 0.005;
    const offsetLng = ((seed * 1.618) % 1 - 0.5) * 0.005;
    return { lat: lat + offsetLat, lng: lng + offsetLng };
  }, []);

  const closeAllInfoWindows = useCallback(() => {
    infoWindowsRef.current.forEach((iw: any) => iw.close());
    currentInfoWindowRef.current = null;
  }, []);

  const updateMarkers = useCallback(async (zoom: number) => {
    const google = (window as GoogleMapsWindow).google;
    if (!google || !mapRef.current || !userLocation) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    infoWindowsRef.current = [];
    closeAllInfoWindows();

    const userMarker = new google.maps.Marker({
      map: mapRef.current,
      position: { lat: userLocation.lat, lng: userLocation.lng },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      zIndex: 9999,
      title: "Your Location",
    });
    markersRef.current.push(userMarker);

    const userInfoWindow = new google.maps.InfoWindow({
      content: `<div style="padding: 8px; font-weight: 600;">${userLocation.name}<br/><small style="color:#666;">Your search location</small></div>`,
    });
    userMarker.addListener("click", () => {
      closeAllInfoWindows();
      userInfoWindow.open(mapRef.current, userMarker);
      currentInfoWindowRef.current = userInfoWindow;
    });
    infoWindowsRef.current.push(userInfoWindow);

    const geocodePromises = services.map(async (s): Promise<FuzzyPoint | null> => {
      let lat = s.locationLat ? parseFloat(s.locationLat as string) : null;
      let lng = s.locationLng ? parseFloat(s.locationLng as string) : null;

      if ((!lat || !lng || isNaN(lat) || isNaN(lng)) && s.locations?.length) {
        try {
          const res = await geocodeLocation(s.locations[0]);
          lat = res.lat;
          lng = res.lng;
        } catch {
          return null;
        }
      }

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        lat = s.owner?.locationLat ? parseFloat(s.owner.locationLat as string) : null;
        lng = s.owner?.locationLng ? parseFloat(s.owner.locationLng as string) : null;
      }

      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        const fuzzy = getFuzzyLocation(lat, lng, s.id);
        return { service: s, lat: fuzzy.lat, lng: fuzzy.lng };
      }
      return null;
    });

    const validPoints = (await Promise.all(geocodePromises)).filter((p): p is FuzzyPoint => p !== null);

    const gridSize = getGridSize(zoom);
    const clusters: Record<string, FuzzyPoint[]> = {};

    validPoints.forEach((p) => {
      const gridLat = Math.round(p.lat / gridSize) * gridSize;
      const gridLng = Math.round(p.lng / gridSize) * gridSize;
      const key = `${gridLat.toFixed(4)},${gridLng.toFixed(4)}`;
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(p);
    });

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });

    Object.values(clusters).forEach((items) => {
      const count = items.length;
      const centerLat = items.reduce((acc, i) => acc + i.lat, 0) / count;
      const centerLng = items.reduce((acc, i) => acc + i.lng, 0) / count;

      bounds.extend({ lat: centerLat, lng: centerLng });

      const markerOptions: any = {
        map: mapRef.current,
        position: { lat: centerLat, lng: centerLng },
        title: count > 1 ? `${count} Services` : items[0].service.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: count > 1 ? 14 : 10,
          fillColor: count > 1 ? "#ef4444" : "#f97316",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      };

      if (count > 1) {
        markerOptions.label = {
          text: String(count),
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "bold",
        };
      }

      const marker = new google.maps.Marker(markerOptions);

      let content = "";
      if (count === 1) {
        const s = items[0].service;
        const imgHtml = s.images?.[0]
          ? `<img src="${s.images[0]}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;"/>`
          : "";
        const priceHtml =
          s.priceType === "fixed"
            ? `<div style="color:#3b82f6;font-weight:600;">CHF ${s.price}</div>`
            : s.priceType === "list"
              ? `<div style="color:#3b82f6;font-weight:600;">From CHF ${(s.priceList as any)?.[0]?.price || "N/A"}</div>`
              : `<div style="color:#666;">Contact for pricing</div>`;

        content = `
          <div style="width:220px;padding:4px;">
            ${imgHtml}
            <strong style="display:block;margin-bottom:4px;font-size:14px;">${s.title}</strong>
            ${priceHtml}
            <div style="color:#888;font-size:11px;margin:6px 0;">Approximate Location</div>
            <a href="/service/${s.id}" style="display:block;background:#0f172a;color:#fff;text-align:center;padding:8px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500;">View Details</a>
          </div>
        `;
      } else {
        const listItems = items
          .slice(0, 10)
          .map(
            (i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee;">
              <span style="font-size:13px;font-weight:500;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i.service.title}</span>
              <a href="/service/${i.service.id}" style="font-size:12px;color:#3b82f6;text-decoration:none;font-weight:500;">View</a>
            </div>
          `
          )
          .join("");

        content = `
          <div style="width:260px;padding:4px;">
            <div style="font-weight:bold;padding-bottom:6px;margin-bottom:6px;border-bottom:2px solid #e5e7eb;">${count} Services in this area</div>
            <div style="max-height:220px;overflow-y:auto;">${listItems}</div>
            ${count > 10 ? `<div style="text-align:center;color:#888;font-size:11px;padding-top:6px;">+ ${count - 10} more</div>` : ""}
          </div>
        `;
      }

      const infoWindow = new google.maps.InfoWindow({ content });

      marker.addListener("click", () => {
        closeAllInfoWindows();
        infoWindow.open(mapRef.current, marker);
        currentInfoWindowRef.current = infoWindow;

        if (count > 1) {
          const newZoom = Math.min(mapRef.current.getZoom() + 2, 17);
          mapRef.current.panTo({ lat: centerLat, lng: centerLng });
          mapRef.current.setZoom(newZoom);
        }
      });

      markersRef.current.push(marker);
      infoWindowsRef.current.push(infoWindow);
    });

    if (validPoints.length > 0) {
      mapRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    }
  }, [services, userLocation, closeAllInfoWindows, getFuzzyLocation]);

  useEffect(() => {
    if (!isExpanded || !apiKey || isInitializedRef.current) return;

    const initMap = async () => {
      const google = (window as GoogleMapsWindow).google;
      if (!google) return;

      const { Map } = (await google.maps.importLibrary("maps")) as any;

      mapRef.current = new Map(mapContainerRef.current, {
        center: { lat: userLocation?.lat || 46.8182, lng: userLocation?.lng || 8.2275 },
        zoom: 12,
        mapId: "COMMERZIO_MAP",
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
      });

      mapRef.current.addListener("click", closeAllInfoWindows);

      mapRef.current.addListener("zoom_changed", () => {
        const newZoom = mapRef.current.getZoom();
        setCurrentZoom(newZoom);
      });

      isInitializedRef.current = true;
      updateMarkers(12);
    };

    if (!(window as GoogleMapsWindow).google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [isExpanded, apiKey, userLocation, closeAllInfoWindows, updateMarkers]);

  useEffect(() => {
    if (isInitializedRef.current) {
      updateMarkers(currentZoom);
    }
  }, [services, currentZoom, updateMarkers]);

  if (!userLocation || !isExpanded) return null;

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-border relative bg-muted">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
