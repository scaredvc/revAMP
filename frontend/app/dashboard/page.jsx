'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import MapApp from '../../components/mapApp'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()

    const [parkingSpots, setParkingSpots] = useState([])
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Fetch parking data for all users (authenticated and guests)
    useEffect(() => {
        if (!authLoading) {
            fetchParkingSpots()
        }
    }, [authLoading])

    const fetchParkingSpots = async (bounds = null, isUpdate = false) => {
        try {
            setError(null)
            if (!isUpdate) setIsLoading(true)

            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/data`
            const response = bounds
                ? await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bounds),
                })
                : await fetch(url)

            if (!response.ok) {
                throw new Error(`Failed to fetch parking data (${response.status})`)
            }

            const data = await response.json()
            const spotsArray = Object.entries(data.parkingSpots).map(([name, details]) => ({
                name,
                description: details.ext_description,
                additionalInfo: details.additional_info,
                coordinates: details.positions.map(pos => ({
                    lat: parseFloat(pos.lat),
                    lng: parseFloat(pos.lng)
                }))
            }))

            setParkingSpots(spotsArray)
        } catch (err) {
            setError(err.message || 'Failed to load parking data')
        } finally {
            if (!isUpdate) setIsLoading(false)
        }
    }

    const handleBoundsChanged = useCallback((bounds) => {
        fetchParkingSpots(bounds, true)
    }, [])

    // Only show spinner while checking auth status
    if (authLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-midnight relative overflow-hidden">
                <div className="gradient-orb gold" style={{ width: 400, height: 400, top: -100, right: -100 }} />
                <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="w-10 h-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
                    <p className="text-sm font-mono text-white/30 tracking-widest uppercase">
                        Verifying session
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="dashboard-layout bg-midnight">
            {/* Header */}
            <header className="dashboard-header">
                <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-600 to-gold flex items-center justify-center shadow-md shadow-gold/10">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="font-mono text-xs tracking-[0.15em] uppercase text-gold/70 hidden sm:block">revAMP</span>
                    </div>

                    {/* Separator */}
                    <div className="w-px h-6 bg-white/[0.06] hidden sm:block" />

                    {/* Page title */}
                    <div className="hidden sm:block">
                        <h1 className="text-sm font-medium text-white/80 tracking-tight">Dashboard</h1>
                        {isAuthenticated && user?.full_name ? (
                            <p className="text-[0.65rem] text-white/25 mt-0.5">
                                Welcome back, {user.full_name.split(' ')[0]}
                            </p>
                        ) : !isAuthenticated ? (
                            <p className="text-[0.65rem] text-white/25 mt-0.5">
                                Browsing as guest
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sage/5 border border-sage/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse-soft" />
                        <span className="text-[0.65rem] text-sage/70 font-mono uppercase tracking-wider">Live</span>
                    </div>

                    {isAuthenticated && user ? (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aggie to-aggie-400 flex items-center justify-center text-xs font-bold text-white/80">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-gold/20 text-gold/70 hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-all duration-200 text-xs font-medium"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                                <polyline points="10,17 15,12 10,7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                            </svg>
                            Sign In
                        </Link>
                    )}
                </div>
            </header>

            {/* Main content area */}
            <div className="flex-1 relative">
                {error ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="glass-panel p-8 max-w-md text-center">
                            <div className="w-14 h-14 rounded-2xl bg-rose/10 border border-rose/20 flex items-center justify-center mx-auto mb-4">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <h3 className="font-display text-lg font-bold text-white/90 mb-2">Connection Error</h3>
                            <p className="text-sm text-white/40 mb-6">{error}</p>
                            <button
                                onClick={() => fetchParkingSpots()}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-600 to-gold text-midnight font-semibold text-sm hover:shadow-lg hover:shadow-gold/20 transition-all"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-12 h-12 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
                            <div className="text-center">
                                <p className="text-sm text-white/50">Loading parking zones</p>
                                <p className="text-[0.65rem] text-white/20 mt-1 font-mono">Fetching live data from UC Davis</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <MapApp
                        parkingSpots={parkingSpots}
                        onBoundsChanged={handleBoundsChanged}
                        isUpdating={false}
                    />
                )}
            </div>
        </main>
    )
}
