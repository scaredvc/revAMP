'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MapApp from '../../components/mapApp'
import UserProfile from '../../components/UserProfile'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
    const router = useRouter()
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()

    const [parkingSpots, setParkingSpots] = useState([])
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace('/login')
        }
    }, [authLoading, isAuthenticated, router])

    useEffect(() => {
        if (isAuthenticated) {
            fetchParkingSpots()
        }
    }, [isAuthenticated])

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

    // Loading states
    if (authLoading || (!isAuthenticated && !authLoading)) {
        return (
            <main className="container mx-auto p-4 bg-black min-h-screen flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>{authLoading ? 'Checking session...' : 'Redirecting...'}</p>
                </div>
            </main>
        )
    }

    return (
        <main className="container mx-auto p-4 min-h-screen" style={{background: 'var(--ucd-darker)'}}>
            <header className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2" style={{color: 'var(--ucd-light)'}}>Dashboard</h1>
                        <p style={{color: 'var(--ucd-muted)'}}>Welcome back{user?.full_name ? `, ${user.full_name}` : ''}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <UserProfile />
                </div>

                <div className="lg:col-span-3">
                    {error ? (
                        <div className="mb-4 p-2 rounded" style={{color: 'var(--ucd-error)', background: 'rgba(220, 38, 38, 0.1)'}}>
                            <p>Error: {error}</p>
                        </div>
                    ) : isLoading ? (
                        <div style={{color: 'var(--ucd-light)'}}>
                            <p>Loading parking data...</p>
                        </div>
                    ) : (
                        <div>
                            <MapApp
                                parkingSpots={parkingSpots}
                                onBoundsChanged={handleBoundsChanged}
                                isUpdating={false}
                            />
                            {parkingSpots.length === 0 && (
                                <div className="text-center mt-4" style={{color: 'var(--ucd-muted)'}}>
                                    <p>No parking spots found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
