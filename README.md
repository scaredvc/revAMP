# revAMP - UC Davis Parking Application Redesign

[![Development Status](https://img.shields.io/badge/status-in%20development-orange)](https://github.com/yourusername/revAMP)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A modern, redesigned parking application for UC Davis that provides real-time parking zone information and interactive mapping capabilities. **Currently in active development.**

**⚠️ Educational Project Disclaimer**: This is an educational project for learning purposes. The application scrapes parking data from UC Davis's public parking services. Users should be aware of the university's terms of service and data usage policies.

## 🚗 Project Overview

revAMP is a full-stack web application **currently under development** that demonstrates modern web development techniques by creating an improved interface for UC Davis parking information:

- **Interactive Parking Map**: Visualization of parking zones around UC Davis *(in development)*
- **Zone Information**: Detailed descriptions and information for each parking zone *(planned)*
- **Modern UI/UX**: Clean, responsive design built with Next.js and Tailwind CSS *(in progress)*
- **Educational Purpose**: Demonstrates API integration, web scraping, and full-stack development

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 18, Tailwind CSS, and Google Maps integration *(in development)*
- **Backend**: Flask API with CORS support for cross-origin requests *(in development)*
- **Maps**: Google Maps JavaScript API for interactive mapping *(implemented)*
- **Styling**: Tailwind CSS for modern, responsive design *(in progress)*
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
├── backend/                 # Flask API server (in development)
│   ├── main.py             # Main Flask application
│   ├── searchZones.py      # Parking zone search functionality
│   ├── getDescription.py   # Zone description retrieval
│   ├── filterByZone.py     # Zone filtering utilities
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend application (in development)
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

### Development Status

| Feature | Status | Notes |
|---------|--------|-------|
| Basic Map Display | ✅ Implemented | Google Maps integration working |
| Parking Zone Data | 🔄 In Progress | Backend API development |
| Search Functionality | 📋 Planned | UI components in development |
| Zone Information Panel | 📋 Planned | Data processing needed |
| Responsive Design | 🔄 In Progress | Tailwind CSS styling |
| Backend API | 🔄 In Progress | Flask endpoints being developed |

### Key Features (Planned/In Development)

- **Interactive Map**: Google Maps integration with custom parking zone overlays *(implemented)*
- **Educational Focus**: Demonstrates modern web development techniques *(ongoing)*
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS *(in progress)*
- **Search Functionality**: Find specific parking zones quickly *(planned)*
- **Information Panel**: Detailed zone descriptions and parking information *(planned)*

## 🔧 API Endpoints (In Development)

- `GET/POST /api/data` - Retrieve parking spot data for specified map bounds *(implemented)*
- `GET /api/zones/<zone_code>` - Get coordinates for a specific parking zone *(in development)*

## 🎨 Technologies Used

### Frontend
- **Next.js 15** - React framework for production *(in development)*
- **React 18** - UI library *(implemented)*
- **Tailwind CSS** - Utility-first CSS framework *(in progress)*
- **Google Maps API** - Interactive mapping *(implemented)*
- **Lucide React** - Beautiful icons *(implemented)*
- **Leaflet** - Alternative mapping library *(planned)*

### Backend
- **Flask** - Python web framework *(in development)*
- **Flask-CORS** - Cross-origin resource sharing *(implemented)*
- **Requests** - HTTP library for API calls *(implemented)*
- **Cloudscraper** - Web scraping utility (educational use only) *(implemented)*
- **Python-dotenv** - Environment variable management *(implemented)*

## 🔒 Security & Ethics

- Environment variables are properly secured and not committed to version control
- API keys are stored in `.env` files (not tracked by Git)
- CORS is properly configured for secure cross-origin requests
- **Educational Use**: This project is for learning purposes only

## ⚖️ Legal & Ethical Considerations

**Important**: This project is for educational purposes only.

- Use the application responsibly
- Understand this is a learning demonstration, not a production service

## 🤝 Contributing

**Development Status**: This project is actively being developed. Contributions are welcome!

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

**Development Status**: This project is currently in active development. Features and functionality may change as development progresses.

**Educational Disclaimer**: This project demonstrates web development techniques using publicly available data. Users should respect all applicable terms of service and use the application responsibly.
