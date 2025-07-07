# revAMP - UC Davis Parking Application Redesign

A modern, redesigned parking application for UC Davis that provides real-time parking zone information and interactive mapping capabilities.

## 🚗 Project Overview

revAMP is a full-stack web application that improves upon UC Davis's current parking system by offering:

- **Interactive Parking Map**: Real-time visualization of parking zones around UC Davis
- **Zone Information**: Detailed descriptions and information for each parking zone
- **Modern UI/UX**: Clean, responsive design built with Next.js and Tailwind CSS
- **Real-time Data**: Live parking zone data from UC Davis parking services

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 18, Tailwind CSS, and Google Maps integration
- **Backend**: Flask API with CORS support for cross-origin requests
- **Maps**: Google Maps JavaScript API for interactive mapping
- **Styling**: Tailwind CSS for modern, responsive design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Google Maps API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/revAMP.git
   cd revAMP
   ```

2. **Set up the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```
   
   **Note**: You'll need to obtain a Google Maps JavaScript API key from the [Google Cloud Console](https://console.cloud.google.com/).

5. **Run the application**

   **Start the backend server:**
   ```bash
   cd backend
   python main.py
   ```
   The backend will run on `http://localhost:5001`

   **Start the frontend development server:**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

## 🛠️ Development

### Project Structure

```
revAMP/
├── backend/                 # Flask API server
│   ├── main.py             # Main Flask application
│   ├── searchZones.py      # Parking zone search functionality
│   ├── getDescription.py   # Zone description retrieval
│   ├── filterByZone.py     # Zone filtering utilities
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend application
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   │   ├── map.jsx         # Interactive map component
│   │   ├── searchBar.jsx   # Search functionality
│   │   ├── infoPanel.jsx   # Information display
│   │   └── mapApp.jsx      # Main map application
│   ├── public/             # Static assets
│   └── package.json        # Node.js dependencies
└── README.md              # This file
```

### Key Features

- **Interactive Map**: Google Maps integration with custom parking zone overlays
- **Real-time Data**: Live parking zone information from UC Davis services
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Search Functionality**: Find specific parking zones quickly
- **Information Panel**: Detailed zone descriptions and parking information

## 🔧 API Endpoints

- `GET/POST /api/data` - Retrieve parking spot data for specified map bounds
- `GET /api/zones/<zone_code>` - Get coordinates for a specific parking zone

## 🎨 Technologies Used

### Frontend
- **Next.js 15** - React framework for production
- **React 18** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Google Maps API** - Interactive mapping
- **Lucide React** - Beautiful icons
- **Leaflet** - Alternative mapping library

### Backend
- **Flask** - Python web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Requests** - HTTP library for API calls
- **Cloudscraper** - Bypass anti-bot protection
- **Python-dotenv** - Environment variable management

## 🔒 Security

- Environment variables are properly secured and not committed to version control
- API keys are stored in `.env` files (not tracked by Git)
- CORS is properly configured for secure cross-origin requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- UC Davis Parking Services for providing parking zone data
- Google Maps Platform for mapping services
- The Next.js and React communities for excellent documentation

## 📞 Contact

For questions or support, please open an issue on GitHub.

---

**Note**: This project requires a Google Maps API key to function properly. Make sure to obtain one from the Google Cloud Console and add it to your `.env` file.
