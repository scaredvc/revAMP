'use client'
import MapApp from '../components/mapApp'
import {useEffect, useState, useCallback} from 'react'

export default function Home() {
    console.log('🏠 Home component rendered');

    const [parkingSpots, setParkingSpots] = useState([])
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchParkingSpots();
    }, [])

    const fetchParkingSpots = async (bounds = null, isUpdate = false) => {
        try {
            setError(null);
            if (!isUpdate) setIsLoading(true);

            const url = process.env.NEXT_PUBLIC_API_URL || 'https://amp-parking.onrender.com/api/data';
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

    return (
        <main className="container mx-auto p-4 bg-black min-h-screen">
            <header className="mb-6">
                <h1 className="text-4xl font-bold text-white mb-2">revAMP</h1>
                <p className="text-gray-300">Find and pay for parking spots at UC Davis</p>
            </header>
            
            {error ? (
                <div className="text-red-400 mb-4 p-2 bg-red-900/20 rounded">
                    <p>Error: {error}</p>
                </div>
            ) : isLoading ? (
                <div className="text-white">
                    <p>Loading...</p>
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
        </main>
    )
}
