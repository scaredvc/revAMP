'use client'
import MapApp from '../components/mapApp'
import LoginForm from '../components/LoginForm'
import UserProfile from '../components/UserProfile'
import {useEffect, useState, useCallback} from 'react'
import { useAuth } from './contexts/AuthContext'

export default function Home() {
    console.log('🏠 Home component rendered');

    const [parkingSpots, setParkingSpots] = useState([])
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showLogin, setShowLogin] = useState(false)

    // Get authentication state from our context
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()

    useEffect(() => {
        fetchParkingSpots();
    }, [])

    const fetchParkingSpots = async (bounds = null, isUpdate = false) => {
        try {
            setError(null);
            if (!isUpdate) setIsLoading(true);

            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/data`;
            const response = bounds
                ? await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bounds),
                })
                : await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch parking data (${response.status})`);
            }

            const data = await response.json();
            const spotsArray = Object.entries(data.parkingSpots).map(([name, details]) => ({
                name,
                description: details.ext_description,
                additionalInfo: details.additional_info,
                coordinates: details.positions.map(pos => ({
                    lat: parseFloat(pos.lat),
                    lng: parseFloat(pos.lng)
                }))
            }));

            setParkingSpots(spotsArray);
        } catch (error) {
            setError(error.message || 'Failed to load parking data');
        } finally {
            if (!isUpdate) setIsLoading(false);
        }
    };

    const handleBoundsChanged = useCallback((bounds) => {
        fetchParkingSpots(bounds, true);
    }, []);

    // Don't render anything while checking authentication
    if (authLoading) {
        return (
            <main className="container mx-auto p-4 bg-black min-h-screen flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </main>
        )
    }

    return (
        <main className="container mx-auto p-4 bg-black min-h-screen">
            {/* Header with Authentication */}
            <header className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">revAMP</h1>
                        <p className="text-gray-300">Find and pay for parking spots at UC Davis</p>
                    </div>
                    
                    {/* Authentication Buttons */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-300">
                                    Welcome, {user?.full_name || user?.email}!
                                </span>
                                <button
                                    onClick={() => setShowLogin(false)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                                >
                                    Dashboard
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowLogin(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            {showLogin ? (
                // Show Login Form
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">Welcome to revAMP</h2>
                        <p className="text-gray-400">Sign in to access your parking dashboard</p>
                    </div>
                    <LoginForm />
                </div>
            ) : isAuthenticated ? (
                // Show User Dashboard with Map
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* User Profile Sidebar */}
                    <div className="lg:col-span-1">
                        <UserProfile />
                    </div>
                    
                    {/* Map and Parking Data */}
                    <div className="lg:col-span-3">
                        {error ? (
                            <div className="text-red-400 mb-4 p-2 bg-red-900/20 rounded">
                                <p>Error: {error}</p>
                            </div>
                        ) : isLoading ? (
                            <div className="text-white">
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
                                    <div className="text-gray-300 text-center mt-4">
                                        <p>No parking spots found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Show Welcome Message for Non-Authenticated Users
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gray-900 rounded-lg shadow-xl p-12 border border-gray-700">
                        <h2 className="text-3xl font-bold text-white mb-4">Welcome to revAMP</h2>
                        <p className="text-gray-300 text-lg mb-8">
                            The better parking application for UC Davis students. 
                            Sign in to access parking maps, track your sessions, and manage your account.
                        </p>
                        <button
                            onClick={() => setShowLogin(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition duration-200"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}
