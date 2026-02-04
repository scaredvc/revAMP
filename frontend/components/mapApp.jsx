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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const trackAnalytics = useCallback(async (type, spotName) => {
    try {
      await fetch(`${API_URL}/api/analytics/${type}/${encodeURIComponent(spotName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      // Analytics tracking is best-effort
    }
  }, [API_URL]);

  const handleSpotClick = async (spot) => {
    trackAnalytics('search', spot.name);
    setSelectedSpot(spot);
    if (mapRef.current) {
      mapRef.current.focusSpot(spot);
    }
  };

  const handleBoundsChange = useCallback((bounds) => {
    onBoundsChanged(bounds);
  }, [onBoundsChanged]);

  const filteredSpots = parkingSpots.filter(spot => {
    return searchQuery === '' ||
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleGetDirections = useCallback(async (spot) => {
    trackAnalytics('directions', spot.name);

    const openMaps = (query) => {
      window.open(query, '_blank');
    };

    if (!spot.coordinates || spot.coordinates.length === 0) {
      openMaps(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.name} UC Davis`)}`);
      return;
    }

    const { lat, lng } = spot.coordinates[0];
    openMaps(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  }, [trackAnalytics]);

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
        {/* Header */}
        <div className="sidebar-header">
          <div className="flex justify-between items-center mb-4">
            <h2 className="sidebar-title font-display">Parking Zones</h2>
            <div className="sidebar-stats">
              <span className="stat-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse-soft" />
                {filteredSpots.length} zones
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search zones..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <p className="search-help">Showing paid parking zones only</p>
        </div>

        {/* Spots list */}
        <div className="spots-list">
          {filteredSpots.map((spot, index) => (
            <div
              key={spot.name || index}
              className={`spot-card ${selectedSpot?.name === spot.name ? 'selected' : ''}`}
              onClick={() => handleSpotClick(spot)}
            >
              <div className="spot-header">
                <div className="spot-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="spot-title-section">
                  <h3 className="spot-name">{spot.name}</h3>
                  <div className="spot-badges">
                    <span className="availability-badge available">
                      <span className="w-1 h-1 rounded-full bg-current" />
                      Active
                    </span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetDirections(spot);
                  }}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3,11 22,2 13,21 11,13 3,11" />
                    </svg>
                    Directions
                  </span>
                </button>
              </div>
            </div>
          ))}

          {filteredSpots.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-white/30 text-sm">No zones found</p>
              <p className="text-white/15 text-xs mt-1">Try a different search term</p>
            </div>
          )}
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
