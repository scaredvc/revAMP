'use client'

import dynamic from 'next/dynamic'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../app/contexts/AuthContext'
import { useFavorites } from '../app/contexts/FavoritesContext'
import { Heart, GripVertical, Trash2, Navigation, MapPin, Search, Sparkles } from 'lucide-react'

const Map = dynamic(
  () => import('./map'),
  { ssr: false }
)

export default function MapApp({ parkingSpots, onBoundsChanged, isUpdating }) {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('zones');
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItem = useRef(null);
  const mapRef = useRef(null);

  const { isAuthenticated } = useAuth();
  const { favorites, toggleFavorite, getFavorite, reorderFavorites, recordUsage, removeFavorite, isLoading: favsLoading } = useFavorites();

  // Reset to zones tab when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveTab('zones');
    }
  }, [isAuthenticated]);

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

  // Listen for toggleFavorite events from InfoWindow
  useEffect(() => {
    const handleToggleFav = (event) => {
      const { zoneName, zoneDescription } = event.detail;
      toggleFavorite(zoneName, zoneDescription);
    };
    window.addEventListener('toggleFavorite', handleToggleFav);
    return () => window.removeEventListener('toggleFavorite', handleToggleFav);
  }, [toggleFavorite]);

  // Drag-and-drop handlers for favorites reorder
  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    const dragIndex = dragItem.current;
    if (dragIndex === null || dragIndex === dropIndex) return;

    const reordered = [...favorites];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    reorderFavorites(reordered);
    dragItem.current = null;
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    setDragOverIndex(null);
  };

  // Find the full parking spot data for a favorite (to get coordinates for directions)
  const findSpotForFavorite = (fav) => {
    return parkingSpots.find(s => s.name === fav.zone_code) || null;
  };

  const handleFavDirections = (fav) => {
    const spot = findSpotForFavorite(fav);
    if (spot) {
      handleGetDirections(spot);
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${fav.zone_code} UC Davis`)}`, '_blank');
    }
  };

  const handleFavUse = (fav) => {
    recordUsage(fav.id);
    const spot = findSpotForFavorite(fav);
    if (spot) {
      handleSpotClick(spot);
    }
  };

  return (
    <div className="main-container">
      <div className="sidebar">
        {/* Header with Tabs */}
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

          {/* Tab Navigation — only show when authenticated */}
          {isAuthenticated && (
            <div className="sidebar-tabs">
              <button
                className={`sidebar-tab ${activeTab === 'zones' ? 'active' : ''}`}
                onClick={() => setActiveTab('zones')}
              >
                <MapPin size={13} strokeWidth={2.5} />
                Zones
              </button>
              <button
                className={`sidebar-tab ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                <Heart size={13} strokeWidth={2.5} />
                Saved
                {favorites.length > 0 && (
                  <span className="tab-count">{favorites.length}</span>
                )}
              </button>
              {/* Active tab indicator */}
              <div
                className="tab-indicator"
                style={{ transform: activeTab === 'favorites' ? 'translateX(100%)' : 'translateX(0)' }}
              />
            </div>
          )}

          {/* Search — only in zones tab */}
          {activeTab === 'zones' && (
            <>
              <div className="relative mt-4">
                <Search
                  size={16}
                  strokeWidth={2}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search zones..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <p className="search-help">Showing paid parking zones only</p>
            </>
          )}
        </div>

        {/* ─── Zones Tab ─── */}
        {activeTab === 'zones' && (
          <div className="spots-list">
            {filteredSpots.map((spot, index) => {
              const isFav = isAuthenticated && !!getFavorite(spot.name);
              return (
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

                    {/* Favorite heart button — authenticated only */}
                    {isAuthenticated && (
                      <button
                        className={`fav-heart-btn ${isFav ? 'is-fav' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(spot.name, spot.description);
                        }}
                        title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                        aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
                      >
                        <Heart
                          size={16}
                          strokeWidth={2}
                          fill={isFav ? 'currentColor' : 'none'}
                        />
                      </button>
                    )}
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
              );
            })}

            {filteredSpots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                  <Search size={20} strokeWidth={1.5} className="text-white/20" />
                </div>
                <p className="text-white/30 text-sm">No zones found</p>
                <p className="text-white/15 text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Favorites Tab ─── */}
        {activeTab === 'favorites' && isAuthenticated && (
          <div className="spots-list">
            {favsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-8 h-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
                <p className="text-white/30 text-xs mt-4 font-mono uppercase tracking-widest">Loading</p>
              </div>
            ) : favorites.length === 0 ? (
              /* ── Empty State ── */
              <div className="fav-empty-state">
                <div className="fav-empty-icon">
                  <Heart size={24} strokeWidth={1.5} />
                </div>
                <h3 className="fav-empty-title">No saved zones yet</h3>
                <p className="fav-empty-desc">
                  Tap the <Heart size={12} strokeWidth={2.5} className="inline-block align-middle mx-0.5 text-gold" /> on any zone to save it here for quick access.
                </p>
                <button
                  className="fav-empty-action"
                  onClick={() => setActiveTab('zones')}
                >
                  <MapPin size={14} strokeWidth={2} />
                  Browse zones
                </button>
              </div>
            ) : (
              /* ── Favorites List with Drag Reorder ── */
              favorites.map((fav, index) => (
                <div
                  key={fav.id}
                  className={`fav-card ${dragOverIndex === index ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Drag handle */}
                  <div className="fav-drag-handle" aria-label="Drag to reorder">
                    <GripVertical size={14} strokeWidth={2} />
                  </div>

                  {/* Card body */}
                  <div className="fav-card-body">
                    <div className="fav-card-top">
                      <div className="fav-card-icon">
                        <Heart size={14} strokeWidth={2.5} fill="currentColor" />
                      </div>
                      <div className="fav-card-info">
                        <h3 className="fav-card-name">{fav.zone_code}</h3>
                        {fav.zone_description && (
                          <p className="fav-card-desc">{fav.zone_description}</p>
                        )}
                      </div>
                    </div>

                    {/* Usage chip */}
                    {fav.times_used > 0 && (
                      <div className="fav-usage-chip">
                        <Sparkles size={10} strokeWidth={2.5} />
                        Used {fav.times_used} time{fav.times_used !== 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="fav-card-actions">
                      <button
                        className="fav-action-btn use"
                        onClick={(e) => { e.stopPropagation(); handleFavUse(fav); }}
                        title="Use this zone"
                      >
                        <MapPin size={13} strokeWidth={2.5} />
                        Locate
                      </button>
                      <button
                        className="fav-action-btn directions"
                        onClick={(e) => { e.stopPropagation(); handleFavDirections(fav); }}
                        title="Get directions"
                      >
                        <Navigation size={13} strokeWidth={2.5} />
                        Directions
                      </button>
                      <button
                        className="fav-action-btn remove"
                        onClick={(e) => { e.stopPropagation(); removeFavorite(fav.id); }}
                        title="Remove from favorites"
                        aria-label="Remove from favorites"
                      >
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
