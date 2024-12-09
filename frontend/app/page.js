'use client'
import MapApp from '../components/mapApp'
import {useEffect, useState} from 'react'

export default function Home() {
    const [parkingSpots, setParkingSpots] = useState([])

    useEffect(() => {
        fetchParkingSpots();
    }, [])

    const fetchParkingSpots = async (bounds = null) => {
        try {
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
                throw new Error('Network response was not ok');
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
        }
    };

    return (
        <main className="container mx-auto p-4">
            <h1 className="text-4xl font-bold mb-4 text-white">revAMP</h1>
            {parkingSpots.length > 0 ? (
                <MapApp parkingSpots={parkingSpots} onBoundsChanged={fetchParkingSpots} />
            ) : (
                <div className="text-white">
                    <p>Loading...</p>
                    <p>Spots loaded: {parkingSpots.length}</p>
                </div>
            )}
        </main>
    )
}

export const metadata = {
  title: 'Home | revAMP',    // Title of the page
}
