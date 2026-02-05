'use client'
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const FavoritesContext = createContext()

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}

export function FavoritesProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const hasFetched = useRef(false)

  const authHeaders = useCallback(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }), [token])

  // Fetch all favorites
  const fetchFavorites = useCallback(async () => {
    if (!token || !isAuthenticated) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/favorites/`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error('Failed to load favorites')
      const data = await res.json()
      setFavorites(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [token, isAuthenticated, authHeaders])

  // Auto-fetch when authenticated
  useEffect(() => {
    if (isAuthenticated && token && !hasFetched.current) {
      hasFetched.current = true
      fetchFavorites()
    }
    if (!isAuthenticated) {
      hasFetched.current = false
      setFavorites([])
    }
  }, [isAuthenticated, token, fetchFavorites])

  // Check if a zone_code is favorited — returns the favorite object or null
  const getFavorite = useCallback((zoneCode) => {
    return favorites.find(f => f.zone_code === zoneCode) || null
  }, [favorites])

  // Add favorite (optimistic)
  const addFavorite = useCallback(async (zoneCode, zoneDescription = null) => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' }

    // Optimistic: add a placeholder
    const optimisticId = `temp-${Date.now()}`
    const optimisticFav = {
      id: optimisticId,
      zone_code: zoneCode,
      zone_description: zoneDescription,
      notes: null,
      display_order: favorites.length,
      times_used: 0,
      last_used: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setFavorites(prev => [...prev, optimisticFav])

    try {
      const res = await fetch(`${API_BASE}/favorites/`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          zone_code: zoneCode,
          zone_description: zoneDescription,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to add favorite')
      }

      const saved = await res.json()
      // Replace optimistic with real
      setFavorites(prev => prev.map(f => f.id === optimisticId ? saved : f))
      return { success: true }
    } catch (err) {
      // Rollback
      setFavorites(prev => prev.filter(f => f.id !== optimisticId))
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [isAuthenticated, favorites.length, authHeaders])

  // Remove favorite (optimistic)
  const removeFavorite = useCallback(async (favoriteId) => {
    if (!isAuthenticated) return { success: false, error: 'Not authenticated' }

    const removed = favorites.find(f => f.id === favoriteId)
    if (!removed) return { success: false, error: 'Not found' }

    // Optimistic: remove immediately
    setFavorites(prev => prev.filter(f => f.id !== favoriteId))

    try {
      const res = await fetch(`${API_BASE}/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      if (!res.ok) throw new Error('Failed to remove favorite')
      return { success: true }
    } catch (err) {
      // Rollback
      setFavorites(prev => [...prev, removed].sort((a, b) => a.display_order - b.display_order))
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [isAuthenticated, favorites, authHeaders])

  // Reorder favorites (optimistic)
  const reorderFavorites = useCallback(async (newOrder) => {
    if (!isAuthenticated) return

    const previousFavorites = [...favorites]
    setFavorites(newOrder)

    try {
      const res = await fetch(`${API_BASE}/favorites/reorder`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          order: newOrder.map((f, i) => ({ id: f.id, display_order: i })),
        }),
      })

      if (!res.ok) throw new Error('Failed to reorder')
    } catch (err) {
      // Rollback
      setFavorites(previousFavorites)
      setError(err.message)
    }
  }, [isAuthenticated, favorites, authHeaders])

  // Record usage
  const recordUsage = useCallback(async (favoriteId) => {
    if (!isAuthenticated) return
    try {
      const res = await fetch(`${API_BASE}/favorites/${favoriteId}/use`, {
        method: 'POST',
        headers: authHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setFavorites(prev =>
          prev.map(f => f.id === favoriteId
            ? { ...f, times_used: data.times_used, last_used: new Date().toISOString() }
            : f
          )
        )
      }
    } catch {
      // Best-effort
    }
  }, [isAuthenticated, authHeaders])

  // Toggle favorite for a zone
  const toggleFavorite = useCallback(async (zoneCode, zoneDescription = null) => {
    const existing = getFavorite(zoneCode)
    if (existing) {
      return removeFavorite(existing.id)
    } else {
      return addFavorite(zoneCode, zoneDescription)
    }
  }, [getFavorite, removeFavorite, addFavorite])

  const value = {
    favorites,
    isLoading,
    error,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    reorderFavorites,
    recordUsage,
    getFavorite,
    toggleFavorite,
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}
