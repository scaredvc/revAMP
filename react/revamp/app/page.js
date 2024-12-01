'use client'
import MapApp from '../components/mapApp'
import {useEffect, useState} from 'react'

export default function Home() {
    const [parkingSpots, setParkingSpots] = useState([])

    // Initial data fetch
    useEffect(() => {
        fetchParkingSpots();
    }, [])

    // Function to fetch parking spots that can be passed down
    const fetchParkingSpots = async (bounds = null) => {
        const method = bounds ? 'POST' : 'GET';
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            ...(bounds && { body: JSON.stringify(bounds) })
        };

        try {
            const response = await fetch('http://127.0.0.1:5001/api/data', options);
            const data = await response.json();
            const spotsArray = Object.entries(data.parkingSpots).map(([name, details]) => ({
                name: name,
                description: details.ext_description,
                additionalInfo: details.additional_info,
                coordinates: details.positions.map(pos => ({
                    lat: parseFloat(pos.lat),
                    lng: parseFloat(pos.lng)
                }))
            }));
            setParkingSpots(spotsArray);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    }

    return (
        <main className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">My Map Application</h1>
            {parkingSpots.length > 0 ? (
                <MapApp parkingSpots={parkingSpots} onBoundsChanged={fetchParkingSpots} />
            ) : (
                <div>
                    <p>Loading...</p>
                    <p>Spots loaded: {parkingSpots.length}</p>
                </div>
            )}
        </main>
    )
}
