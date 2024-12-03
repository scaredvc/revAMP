const fetchParkingSpots = async (bounds = null) => {
    try {
        const url = 'https://amp-parking.onrender.com/api/data';
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
        setParkingSpots(Object.values(data.parkingSpots));
    } catch (error) {
        console.error('Error fetching parking spots:', error);
    }
}; 