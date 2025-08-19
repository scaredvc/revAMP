'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Loader } from "@googlemaps/js-api-loader";

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
      console.log('Initializing Google Maps...');
      console.log('API Key exists:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
      console.log('API Key value:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
      
      if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        console.error('No Google Maps API key found!');
        return;
      }
      
      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          version: "weekly",
        });

        const google = await loader.load();
        console.log('Google Maps loaded successfully:', google);
        setGoogleMaps(google);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    console.log('Map init effect - googleMaps:', !!googleMaps, 'mapRef.current:', !!mapRef.current, 'mapInstance:', !!mapInstance);
    
    if (!googleMaps || !mapRef.current) return;

    if (!mapInstance) {
      console.log('Creating new map instance...');
      // Initialize map with default center (can be anywhere, will be updated when data arrives)
      const map = new googleMaps.maps.Map(mapRef.current, {
        center: { 
          lat: 40.7128, // Default to NYC coordinates
          lng: -74.0060
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

      console.log('Map created successfully:', map);
      setMapInstance(map);

      map.addListener('dragstart', () => {
        isDragging.current = true;
        // Clear any pending debounced calls when dragging starts
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
      });

      map.addListener('dragend', () => {
        isDragging.current = false;
        // Wait a bit after drag ends before fetching new data
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
        
        debounceTimeout.current = setTimeout(() => {
          const bounds = map.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          
          console.log('Map moved, fetching new data for bounds:', {
            left_long: sw.lng(),
            right_long: ne.lng(),
            top_lat: ne.lat(),
            bottom_lat: sw.lat()
          });
          
          onBoundsChanged({
            left_long: sw.lng(),
            right_long: ne.lng(),
            top_lat: ne.lat(),
            bottom_lat: sw.lat()
          });
        }, 500); // Increased delay to reduce API calls
      });

      map.addListener('zoom_changed', () => {
        // Only handle zoom changes if not currently dragging
        if (isDragging.current) return;
        
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
        
        debounceTimeout.current = setTimeout(() => {
          // Double-check we're still not dragging
          if (isDragging.current) return;
          
          const bounds = map.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          
          console.log('Map zoomed, fetching new data for bounds:', {
            left_long: sw.lng(),
            right_long: ne.lng(),
            top_lat: ne.lat(),
            bottom_lat: sw.lat()
          });
          
          onBoundsChanged({
            left_long: sw.lng(),
            right_long: ne.lng(),
            top_lat: ne.lat(),
            bottom_lat: sw.lat()
          });
        }, 800); // Increased delay for zoom changes
      });
    }

    // Cleanup function to clear timeout when component unmounts
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [googleMaps, mapRef.current, onBoundsChanged]);

  // Separate effect to center map when parking spots data arrives
  useEffect(() => {
    console.log('Parking spots effect - mapInstance:', !!mapInstance, 'parkingSpots.length:', parkingSpots.length);
    
    if (!mapInstance || !parkingSpots.length) return;

    // Only center the map if it hasn't been centered yet (first load)
    if (mapInstance.getCenter().lat() === 40.7128 && mapInstance.getCenter().lng() === -74.0060) {
      const validSpot = parkingSpots.find(spot => 
        spot.coordinates && 
        spot.coordinates[0] && 
        typeof spot.coordinates[0].lat === 'number' && 
        typeof spot.coordinates[0].lng === 'number'
      );

      if (validSpot) {
        console.log('Centering map on first parking spot:', validSpot.name, 'at:', validSpot.coordinates[0]);
        // Center the map on the first valid parking spot only on initial load
        mapInstance.setCenter(validSpot.coordinates[0]);
      } else {
        console.log('No valid parking spot found for centering');
      }
    } else {
      console.log('Map already centered, skipping recentering');
    }
  }, [parkingSpots, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !googleMaps || !parkingSpots.length) return;

    console.log('Creating markers for', parkingSpots.length, 'parking spots');

    if (activeInfoWindow.current) {
      activeInfoWindow.current.close();
    }
    Object.values(markersRef.current).forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = {};

    parkingSpots.forEach((spot) => {
      try {
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
        console.log('Created marker for:', spot.name);
      } catch (error) {
        console.error('Error creating marker for', spot.name, ':', error);
      }
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
  }, [parkingSpots, mapInstance, googleMaps]);

  return (
    <div className="relative">
      <div className="map-container" ref={mapRef} />
      {isUpdating && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 rounded-lg px-4 py-3 shadow-lg z-10 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <span className="text-sm font-medium text-gray-800">Updating map data...</span>
              <p className="text-xs text-gray-600 mt-1">New parking spots are being loaded</p>
            </div>
          </div>
        </div>
      )}
      {!isUpdating && parkingSpots.length === 0 && mapInstance && (
        <div className="absolute top-4 left-4 bg-yellow-50 bg-opacity-95 rounded-lg px-3 py-2 shadow-lg z-10 border border-yellow-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-xs text-yellow-800">No parking spots in this area</span>
          </div>
        </div>
      )}
    </div>
  );
});

Map.displayName = 'Map';

export default Map;