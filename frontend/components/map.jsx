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
      console.log('Map init starting...');

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
        console.log('Google Maps loaded successfully');
        setGoogleMaps(google);
      } catch (error) {
        console.error('Failed to load Google Maps:', error.message);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!googleMaps || !mapRef.current) return;

    if (!mapInstance) {
      console.log('Creating map instance...');

      const map = new googleMaps.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 15,
        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ color: "#2d3748" }]
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#4a5568" }]
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "road",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#1a1a1a" }, { weight: 1 }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#1a365d" }]
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f1f5f9" }]
          },
          {
            featureType: "poi",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#1a1a1a" }, { weight: 1 }]
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#374151" }]
          }
        ]
      });

      console.log('Map created successfully');
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
        mapInstance.setCenter(validSpot.coordinates[0]);
      }
    }
  }, [parkingSpots, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !googleMaps || !parkingSpots.length) return;



    if (activeInfoWindow.current) {
      activeInfoWindow.current.close();
    }
    Object.values(markersRef.current).forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = {};

    parkingSpots.forEach((spot) => {
      try {
        // Create custom marker icon - showing as available for user experience
        const markerIcon = {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#10B981" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="8" fill="white" opacity="0.9"/>
              <path d="M12 16l3 3 5-5" stroke="#10B981" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
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
                  <span class="status-badge available">Available</span>
                </div>
              </div>
            </div>
            <div class="info-content">
              ${spot.description ? `
                <p class="info-description">${spot.description}</p>
              ` : ''}
              ${spot.additionalInfo ? `
                <div class="info-details">
                  <span class="detail-item">${spot.additionalInfo}</span>
                </div>
              ` : ''}
            </div>
            <div class="info-footer">
              <button class="info-button primary" onclick="window.dispatchEvent(new CustomEvent('getDirections', {detail: '${spot.name}'}))">
                Get Directions
              </button>
              <button class="info-button secondary" onclick="window.dispatchEvent(new CustomEvent('viewDetails', {detail: '${spot.name}'}))">
                View Details
              </button>
            </div>
          </div>
        `;

        const infoWindow = new googleMaps.maps.InfoWindow({
          content: contentString,
          maxWidth: 300
        });

        marker.addListener('click', async () => {
          if (activeInfoWindow.current) {
            activeInfoWindow.current.close();
          }

          // Track search analytics when user clicks on map marker
          try {
            await fetch(`https://amp-parking.onrender.com/api/analytics/search/${encodeURIComponent(spot.name)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).catch(error => console.warn('Map marker analytics tracking failed:', error));
          } catch (error) {
            console.warn('Map marker analytics tracking failed:', error);
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
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 rounded-xl px-4 py-3 shadow-lg z-10 border border-gray-200 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300"></div>
              <div className="absolute inset-0 animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-800">Updating map data...</span>
              <p className="text-xs text-gray-600 mt-1">New parking spots are being loaded</p>
            </div>
          </div>
        </div>
      )}
      {!isUpdating && parkingSpots.length === 0 && mapInstance && (
        <div className="absolute top-4 left-4 bg-amber-50 bg-opacity-95 rounded-xl px-4 py-3 shadow-lg z-10 border border-amber-200 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
            <div>
              <span className="text-sm font-medium text-amber-800">No parking spots found</span>
              <p className="text-xs text-amber-600 mt-1">Try zooming out or moving to a different area</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Map.displayName = 'Map';

export default Map;