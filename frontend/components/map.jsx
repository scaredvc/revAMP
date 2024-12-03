'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const Map = forwardRef(({ parkingSpots, onBoundsChanged, selectedSpot }, ref) => {
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
    if (selectedSpot) {
      const marker = markersRef.current[selectedSpot.name];
      if (marker) {
        mapInstance.panTo(selectedSpot.coordinates[0]);
        google.maps.event.trigger(marker, 'click');
      }
    }
  }, [selectedSpot]);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        version: "weekly",
      });

      const google = await loader.load();
      setGoogleMaps(google);
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!googleMaps || !mapRef.current || !parkingSpots.length) return;

    if (!mapInstance) {
      const validSpot = parkingSpots.find(spot => 
        spot.coordinates && 
        spot.coordinates[0] && 
        typeof spot.coordinates[0].lat === 'number' && 
        typeof spot.coordinates[0].lng === 'number'
      );

      if (!validSpot) return;

      const map = new googleMaps.maps.Map(mapRef.current, {
        center: { 
          lat: validSpot.coordinates[0].lat, 
          lng: validSpot.coordinates[0].lng 
        },
        zoom: 15,
        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#d6d6d6" }]
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#c9c9c9" }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#b3b3b3" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e9e9e9" }]
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#f0f0f0" }]
          },
          {
            featureType: "all",
            elementType: "labels.text.fill",
            stylers: [{ color: "#333333" }]
          }
        ]
      });

      setMapInstance(map);

      map.addListener('dragstart', () => {
        isDragging.current = true;
      });

      map.addListener('dragend', () => {
        isDragging.current = false;
        const bounds = map.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        onBoundsChanged({
          left_long: sw.lng(),
          right_long: ne.lng(),
          top_lat: ne.lat(),
          bottom_lat: sw.lat()
        });
      });

      map.addListener('zoom_changed', () => {
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
        
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
    }
  }, [googleMaps, mapInstance, parkingSpots]);

  useEffect(() => {
    if (!mapInstance || !parkingSpots.length) return;

    if (activeInfoWindow.current) {
      activeInfoWindow.current.close();
    }
    Object.values(markersRef.current).forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = {};

    parkingSpots.forEach((spot) => {
      const marker = new googleMaps.maps.Marker({
        map: mapInstance,
        position: spot.coordinates[0],
        title: spot.name,
        icon: {
          path: googleMaps.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#FF7B7B",
          fillOpacity: 0.7,
          strokeWeight: 2,
          strokeColor: "rgba(255, 123, 123, 0.2)",
        }
      });

      const contentString = `
        <div class="info-window" style="max-width: 300px; padding: 10px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
            ${spot.name}
          </h3>
          ${spot.description ? `
            <p style="margin-bottom: 8px; font-size: 14px;">
              ${spot.description}
            </p>
          ` : ''}
          ${spot.additionalInfo ? `
            <div style="font-size: 13px; color: #666;">
              ${spot.additionalInfo}
            </div>
          ` : ''}
        </div>
      `;

      const infoWindow = new googleMaps.maps.InfoWindow({
        content: contentString,
        maxWidth: 300
      });

      marker.addListener('click', () => {
        if (activeInfoWindow.current) {
          activeInfoWindow.current.close();
        }
        
        infoWindow.open({
          anchor: marker,
          map: mapInstance
        });
        
        activeInfoWindow.current = infoWindow;
      });

      mapInstance.addListener('click', () => {
        if (activeInfoWindow.current) {
          activeInfoWindow.current.close();
        }
      });

      markersRef.current[spot.name] = marker;
    });

    return () => {
      if (activeInfoWindow.current) {
        activeInfoWindow.current.close();
      }
      Object.values(markersRef.current).forEach(marker => {
        marker.setMap(null);
      });
      markersRef.current = {};
    };
  }, [parkingSpots, mapInstance]);

  return <div className="map-container" ref={mapRef} />;
});

Map.displayName = 'Map';

export default Map;