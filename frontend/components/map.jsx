'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Loader } from "@googlemaps/js-api-loader";

// Refined dark map style that matches our midnight aesthetic
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#151B2E" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B0F1A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#555566" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1A2036" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#555566" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [{ color: "#1A2036" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#151B2E" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1A2036" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6B7280" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#0E2420" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#2DD4A8" }, { lightness: -30 }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1E2540" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0B0F1A" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8A8A99" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#252D4A" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0B0F1A" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#D4A843" }, { lightness: -20 }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1A2036" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#D4A843" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0A1628" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#1A6499" }],
  },
];

const Map = forwardRef(({ parkingSpots, onBoundsChanged, selectedSpot, isUpdating }, ref) => {
  const mapRef = useRef(null);
  const [googleMaps, setGoogleMaps] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const debounceTimeout = useRef(null);
  const isDragging = useRef(false);
  const markersRef = useRef({});
  const activeInfoWindow = useRef(null);

  useImperativeHandle(ref, () => ({
    focusSpot: (spot) => {
      if (!mapInstance || !spot) return;
      const marker = markersRef.current[spot.name];
      if (marker) {
        mapInstance.panTo(spot.coordinates[0]);
        google.maps.event.trigger(marker, 'click');
      }
    }
  }));

  useEffect(() => {
    if (selectedSpot && mapInstance) {
      const marker = markersRef.current[selectedSpot.name];
      if (marker) {
        mapInstance.panTo(selectedSpot.coordinates[0]);
        google.maps.event.trigger(marker, 'click');
      }
    }
  }, [selectedSpot, mapInstance]);

  useEffect(() => {
    const initMap = async () => {
      if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return;
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          version: "weekly",
        });
        const google = await loader.load();
        setGoogleMaps(google);
      } catch (error) {
        // Map loading failed silently
      }
    };
    initMap();
  }, []);

  useEffect(() => {
    if (!googleMaps || !mapRef.current) return;

    if (!mapInstance) {
      const map = new googleMaps.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 15,
        styles: MAP_STYLES,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControlOptions: {
          position: googleMaps.maps.ControlPosition.RIGHT_CENTER,
        },
      });

      setMapInstance(map);

      map.addListener('dragstart', () => {
        isDragging.current = true;
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      });

      map.addListener('dragend', () => {
        isDragging.current = false;
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
          const bounds = map.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          onBoundsChanged({
            left_long: sw.lng(),
            right_long: ne.lng(),
            top_lat: ne.lat(),
            bottom_lat: sw.lat()
          });
        }, 500);
      });

      map.addListener('zoom_changed', () => {
        if (isDragging.current) return;
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
          if (isDragging.current) return;
          const bounds = map.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          onBoundsChanged({
            left_long: sw.lng(),
            right_long: ne.lng(),
            top_lat: ne.lat(),
            bottom_lat: sw.lat()
          });
        }, 800);
      });
    }

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [googleMaps, mapRef.current, onBoundsChanged]);

  // Center map on first data load
  useEffect(() => {
    if (!mapInstance || !parkingSpots.length) return;
    if (mapInstance.getCenter().lat() === 40.7128 && mapInstance.getCenter().lng() === -74.0060) {
      const validSpot = parkingSpots.find(spot =>
        spot.coordinates &&
        spot.coordinates[0] &&
        typeof spot.coordinates[0].lat === 'number' &&
        typeof spot.coordinates[0].lng === 'number'
      );
      if (validSpot) {
        mapInstance.setCenter(validSpot.coordinates[0]);
      }
    }
  }, [parkingSpots, mapInstance]);

  // Update markers
  useEffect(() => {
    if (!mapInstance || !googleMaps || !parkingSpots.length) return;

    if (activeInfoWindow.current) activeInfoWindow.current.close();
    Object.values(markersRef.current).forEach(marker => marker.setMap(null));
    markersRef.current = {};

    parkingSpots.forEach((spot) => {
      try {
        // Custom marker - gold/sage pin
        const markerIcon = {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="12" fill="#D4A843" stroke="#0B0F1A" stroke-width="2.5"/>
              <circle cx="14" cy="14" r="5" fill="#0B0F1A" opacity="0.7"/>
              <circle cx="14" cy="14" r="2.5" fill="white" opacity="0.9"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(28, 28),
          anchor: new google.maps.Point(14, 14)
        };

        const marker = new googleMaps.maps.Marker({
          map: mapInstance,
          position: spot.coordinates[0],
          title: spot.name,
          icon: markerIcon,
          animation: google.maps.Animation.DROP
        });

        const contentString = `
          <div class="info-window">
            <div class="info-header">
              <div class="info-title-section">
                <h3 class="info-title">${spot.name}</h3>
                <div class="info-status">
                  <span class="status-badge available">Active</span>
                </div>
              </div>
            </div>
            <div class="info-content">
              ${spot.description ? `<p class="info-description">${spot.description}</p>` : ''}
              ${spot.additionalInfo ? `
                <div class="info-details">
                  <span class="detail-item">${spot.additionalInfo}</span>
                </div>
              ` : ''}
            </div>
            <div class="info-footer">
              <button class="info-button primary" onclick="window.dispatchEvent(new CustomEvent('getDirections', {detail: '${spot.name.replace(/'/g, "\\'")}'}))">
                Directions
              </button>
            </div>
          </div>
        `;

        const infoWindow = new googleMaps.maps.InfoWindow({
          content: contentString,
          maxWidth: 300
        });

        marker.addListener('click', () => {
          if (activeInfoWindow.current) activeInfoWindow.current.close();
          infoWindow.open({ anchor: marker, map: mapInstance });
          activeInfoWindow.current = infoWindow;
        });

        mapInstance.addListener('click', () => {
          if (activeInfoWindow.current) activeInfoWindow.current.close();
        });

        markersRef.current[spot.name] = marker;
      } catch (error) {
        // Skip markers that fail
      }
    });

    return () => {
      if (activeInfoWindow.current) activeInfoWindow.current.close();
      Object.values(markersRef.current).forEach(marker => marker.setMap(null));
      markersRef.current = {};
    };
  }, [parkingSpots, mapInstance, googleMaps]);

  return (
    <div className="relative w-full h-full">
      <div className="map-container" ref={mapRef} />

      {/* Loading overlay */}
      {isUpdating && (
        <div className="absolute top-5 right-5 glass-panel px-4 py-3 z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
            <div>
              <span className="text-xs font-medium text-white/80">Updating zones</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isUpdating && parkingSpots.length === 0 && mapInstance && (
        <div className="absolute top-5 left-5 glass-panel px-4 py-3 z-10 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse-soft" />
            <div>
              <span className="text-xs font-medium text-white/70">No zones in view</span>
              <p className="text-[0.65rem] text-white/30 mt-0.5">Zoom out or pan the map</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Map.displayName = 'Map';

export default Map;
