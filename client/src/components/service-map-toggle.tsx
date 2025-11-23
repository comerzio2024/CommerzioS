import { Button } from "@/components/ui/button";
import { Map, ZoomIn, ZoomOut, X } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ServiceWithDetails } from "@/lib/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface ServiceMapToggleProps {
  services: (ServiceWithDetails & { distance?: number })[];
  userLocation: { lat: number; lng: number; name: string } | null;
  maxServices?: number;
  defaultExpanded?: boolean;
}

export function ServiceMapToggle({
  services,
  userLocation,
  maxServices = 5,
  defaultExpanded = false,
}: ServiceMapToggleProps) {
  // Early return if no userLocation - must be before any hooks
  if (!userLocation) return null;

  const [isMapVisible, setIsMapVisible] = useState(defaultExpanded);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Memoize closest services to prevent unnecessary re-renders
  const closestServices = useMemo(() => {
    return services
      .filter(s => s.owner?.locationLat && s.owner?.locationLng)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, maxServices);
  }, [services, maxServices]);

  // Effect 1: Initialize map when it becomes visible
  useEffect(() => {
    if (!isMapVisible || !mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      touchZoom: true,
      dragging: true,
    }).setView([userLocation.lat, userLocation.lng], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
  }, [isMapVisible, userLocation]);

  // Effect 2: Update markers when services or location changes
  useEffect(() => {
    if (!isMapVisible || !mapRef.current) return;

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add user location marker
    const userIcon = L.divIcon({
      className: "user-location-marker",
      html: `<div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(`<strong>${userLocation.name}</strong><br/>Your location`);
    
    markersRef.current.push(userMarker);

    // Add service markers
    const bounds: [number, number][] = [[userLocation.lat, userLocation.lng]];

    closestServices.forEach((service, index) => {
      if (!service.owner?.locationLat || !service.owner?.locationLng) return;

      const serviceLat = parseFloat(service.owner.locationLat as any);
      const serviceLng = parseFloat(service.owner.locationLng as any);

      const serviceIcon = L.divIcon({
        className: "service-marker",
        html: `<div style="background: #ef4444; color: white; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">${index + 1}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const serviceMarker = L.marker([serviceLat, serviceLng], { icon: serviceIcon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 200px;">
            <strong>${service.title}</strong><br/>
            <span style="color: #3b82f6; font-weight: 600;">CHF ${service.price}</span>
            ${service.distance ? `<br/><span style="color: #64748b;">${service.distance.toFixed(1)} km away</span>` : ''}
          </div>
        `);

      markersRef.current.push(serviceMarker);
      bounds.push([serviceLat, serviceLng]);
    });

    // Fit map to show all markers
    if (bounds.length > 1) {
      map.fitBounds(bounds as any, { padding: [50, 50] });
    }
  }, [isMapVisible, userLocation, closestServices]);

  // Effect 3: Cleanup when map is hidden
  useEffect(() => {
    if (!isMapVisible && mapRef.current) {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, [isMapVisible]);

  // Effect 4: Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  // Show helpful message if no services with locations
  if (closestServices.length === 0) {
    return (
      <div className="text-center text-slate-500 py-4" data-testid="text-no-services-map">
        No services with locations available to display on the map.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMapVisible(!isMapVisible)}
          className="gap-2"
          data-testid="button-toggle-map"
        >
          {isMapVisible ? (
            <>
              <X className="w-4 h-4" />
              Collapse Map
            </>
          ) : (
            <>
              <Map className="w-4 h-4" />
              Show Map ({closestServices.length} locations)
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isMapVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 400, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-lg border border-slate-200"
          >
            <div className="relative w-full h-full">
              <div
                ref={mapContainerRef}
                className="w-full h-full"
                data-testid="service-map"
              />
              
              {/* Custom zoom controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleZoomIn}
                  className="bg-white hover:bg-slate-50 shadow-lg"
                  data-testid="button-zoom-in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleZoomOut}
                  className="bg-white hover:bg-slate-50 shadow-lg"
                  data-testid="button-zoom-out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
