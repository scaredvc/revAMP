# revAMP - UC Davis Parking Application Redesign

A modern, redesigned parking application for UC Davis that provides real-time parking zone information and interactive mapping capabilities.

**⚠️ Educational Project Disclaimer**: This is an educational project for learning purposes. The application scrapes parking data from UC Davis's public parking services. Users should be aware of the university's terms of service and data usage policies.

## 🚗 Project Overview

revAMP is a full-stack web application that demonstrates modern web development techniques by creating an improved interface for UC Davis parking information:

- **Interactive Parking Map**: Visualization of parking zones around UC Davis
- **Zone Information**: Detailed descriptions and information for each parking zone
- **Modern UI/UX**: Clean, responsive design built with Next.js and Tailwind CSS
- **Educational Purpose**: Demonstrates API integration, web scraping, and full-stack development

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 18, Tailwind CSS, and Google Maps integration
- **Backend**: Flask API with CORS support for cross-origin requests
- **Maps**: Google Maps JavaScript API for interactive mapping
- **Styling**: Tailwind CSS for modern, responsive design
- **Data Source**: Public UC Davis parking services (for educational purposes)

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
- **Educational Focus**: Demonstrates modern web development techniques
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
- **Cloudscraper** - Web scraping utility (educational use only)
- **Python-dotenv** - Environment variable management

## 🔒 Security & Ethics

- Environment variables are properly secured and not committed to version control
- API keys are stored in `.env` files (not tracked by Git)
- CORS is properly configured for secure cross-origin requests
- **Educational Use**: This project is for learning purposes only
- **Data Source**: Uses publicly available UC Davis parking information
- **Rate Limiting**: Implemented to respect server resources

## ⚖️ Legal & Ethical Considerations

**Important**: This project is for educational purposes only. Users should:

- Respect UC Davis's terms of service
- Be aware of data usage policies
- Use the application responsibly
- Consider the impact on university servers
- Understand this is a learning demonstration, not a production service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and commit them with clear, descriptive messages
4. Submit a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- UC Davis Parking Services for providing public parking zone data
- Google Maps Platform for mapping services
- The Next.js and React communities for excellent documentation

## 📞 Contact

For questions or support, please open an issue on GitHub.

---

**Note**: This project requires a Google Maps API key to function properly. Make sure to obtain one from the Google Cloud Console and add it to your `.env` file.

**Educational Disclaimer**: This project demonstrates web development techniques using publicly available data. Users should respect all applicable terms of service and use the application responsibly.
