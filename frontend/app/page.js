'use client'
import MapApp from '../components/mapApp'
import {useEffect, useState, useCallback} from 'react'

export default function Home() {
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
        <main className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-4 text-white">revAMP</h1>
            
            {error ? (
                <div className="text-red-500 mb-4 p-2 bg-red-50 rounded">
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
                        <div className="text-white text-center mt-4">
                            <p>No parking spots found</p>
                        </div>
                    )}
                </div>
            )}
        </main>
    )
}
