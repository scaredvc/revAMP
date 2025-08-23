'use client'

import dynamic from 'next/dynamic'
import { useState, useRef, useEffect, useCallback } from 'react'

const Map = dynamic(
  () => import('./map'),
  { ssr: false }
)

export default function MapApp({ parkingSpots, onBoundsChanged, isUpdating }) {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef(null);

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
    if (mapRef.current) {
      mapRef.current.focusSpot(spot);
    }
  };

  const handleBoundsChange = useCallback((bounds) => {
    onBoundsChanged(bounds);
  }, [onBoundsChanged]);

  // Filter parking spots based on search query only
  const filteredSpots = parkingSpots.filter(spot => {
    return searchQuery === '' ||
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };



  const handleGetDirections = useCallback((spot) => {
    // Frontend-only approach: direct URL generation
    if (!spot.coordinates || spot.coordinates.length === 0) {
      // Try to use the zone name as destination for Google Maps search
      const searchQuery = encodeURIComponent(`${spot.name} UC Davis`);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      window.open(googleMapsUrl, '_blank');
      return;
    }

    // Use available coordinates
    const { lat, lng } = spot.coordinates[0];
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  }, []);

  // Handle directions requests from map markers
  useEffect(() => {
    const handleMapDirections = (event) => {
      const spotName = event.detail;
      const spot = parkingSpots.find(s => s.name === spotName);
      if (spot) {
        handleGetDirections(spot);
      }
    };

    window.addEventListener('getDirections', handleMapDirections);
    return () => window.removeEventListener('getDirections', handleMapDirections);
  }, [parkingSpots, handleGetDirections]);

  return (
    <div className="main-container">
      <div className="sidebar">
        {/* Header with search and stats */}
        <div className="sidebar-header">
          <h2 className="sidebar-title">Paid Parking Zones</h2>
          <div className="sidebar-stats">
            <span className="stat-badge">{filteredSpots.length} of {parkingSpots.length} zones</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search paid parking zones..."
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <p className="search-help">Note: Only paid parking zones are shown</p>
        </div>

        <div className="spots-list">
          {filteredSpots.map((spot, index) => (
            <div
              key={index}
              className={`spot-card ${selectedSpot?.name === spot.name ? 'selected' : ''}`}
              onClick={() => handleSpotClick(spot)}
            >
              <div className="spot-header">
                <div className="spot-icon">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h1m6-10V6a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2V8a2 2 0 00-2-2h-2V6a2 2 0 00-2-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="spot-title-section">
                  <h3 className="spot-name">{spot.name}</h3>
                  <div className="spot-badges">
                    <span className="availability-badge available">Available</span>
                  </div>
                </div>
              </div>

              <div className="spot-content">
                <p className="spot-description">{spot.description}</p>
                {spot.additionalInfo && (
                  <div className="spot-details">
                    <span className="detail-item">{spot.additionalInfo}</span>
                  </div>
                )}
              </div>

              <div className="spot-footer">
                <button
                  className="action-button secondary"
                  onClick={() => handleGetDirections(spot)}
                >
                  Get Directions
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="map-section">
        <div className="map-wrapper">
          <Map
            ref={mapRef}
            parkingSpots={filteredSpots}
            onBoundsChanged={handleBoundsChange}
            isUpdating={isUpdating}
            selectedSpot={selectedSpot}
          />
        </div>
      </div>
    </div>
  )
}

