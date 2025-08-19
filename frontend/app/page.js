'use client'
import MapApp from '../components/mapApp'
import {useEffect, useState} from 'react'

export default function Home() {
    const [parkingSpots, setParkingSpots] = useState([])
    const [error, setError] = useState(null)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [isUpdatingData, setIsUpdatingData] = useState(false)

    useEffect(() => {
        fetchParkingSpots();
    }, [])

    const fetchParkingSpots = async (bounds = null, isUpdate = false) => {
        try {
            if (!isUpdate) {
                setError(null);
                setIsInitialLoading(true);
            } else {
                setIsUpdatingData(true);
            }
            
            const url = 'https://amp-parking.onrender.com/api/data'; // url to fetch data from should be fetched from backend 
            console.log('Fetching from:', url);
            const response = bounds 
                ? await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bounds),
                })
                : await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch parking data. Please try again.');
            }

            const data = await response.json();
            console.log('Received data:', data);
            
            // Transform the data back to the expected format
            const spotsArray = Object.entries(data.parkingSpots).map(([name, details]) => ({
                name: name,
                description: details.ext_description,
                additionalInfo: details.additional_info,
                coordinates: details.positions.map(pos => ({
                    lat: parseFloat(pos.lat),
                    lng: parseFloat(pos.lng)
                }))
            }));
            
            console.log('Transformed spots:', spotsArray);
            setParkingSpots(spotsArray);
        } catch (error) {
            console.error('Error fetching parking spots:', error);
            if (!isUpdate) {
                setError(error.message || 'An error occurred while loading parking data.');
            }
        } finally {
            if (!isUpdate) {
                setIsInitialLoading(false);
            } else {
                setIsUpdatingData(false);
            }
        }
    };

    const handleBoundsChanged = (bounds) => {
        // Only fetch new data when bounds change, don't show main loading
        fetchParkingSpots(bounds, true);
    };

    const handleRetry = () => {
        fetchParkingSpots();
    };

    return (
        <main className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-4 text-white">revAMP</h1>
            
            {error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <strong className="font-bold">Error!</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                        <button 
                            onClick={handleRetry}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            ) : null}
            
            {isInitialLoading ? (
                <div className="text-white">
                    <p>Loading... Please wait this may take a moment</p> 
                </div>
            ) : (
                <div>
                    <MapApp 
                        parkingSpots={parkingSpots} 
                        onBoundsChanged={handleBoundsChanged}
                        isUpdating={isUpdatingData}
                    />
                    {parkingSpots.length === 0 && !isUpdatingData && (
                        <div className="text-white text-center mt-4">
                            <p>No parking spots found in this area.</p>
                            <p className="text-sm text-gray-400">Try moving the map to a different location.</p>
                        </div>
                    )}
                </div>
            )}
        </main>
    )
}
