'use client'

import dynamic from 'next/dynamic'
import { useState, useRef, useEffect, useCallback } from 'react'

const Map = dynamic(
  () => import('./map'),
  { ssr: false }
)

export default function MapApp({ parkingSpots, onBoundsChanged, isUpdating }) {
  const [selectedSpot, setSelectedSpot] = useState(null);
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

  return (
    <div className="main-container">
      <div className="sidebar">

        <div className="spots-list">
          {parkingSpots.map((spot, index) => (
            <div key={index} className="spot-item">
              <h3 className="spot-name">{spot.name}</h3>
              <p className="spot-address">{spot.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="map-section">
        <div className="map-wrapper">
          <Map
            ref={mapRef}
            parkingSpots={parkingSpots}
            onBoundsChanged={handleBoundsChange}
            isUpdating={isUpdating}
            selectedSpot={selectedSpot}
          />
        </div>
      </div>
    </div>
  )
}

