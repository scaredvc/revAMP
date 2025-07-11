import json
from pprint import pprint
from searchZones import search_zones
from getDescription import get_description
from filterByZone import filter_by_zone
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

app = Flask(__name__)
CORS(app)

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Initialize with default values
BASE_URL = "https://aimsmobilepay.com/api/zone/index.php"
DEFAULT_BOUNDS = {
    "left_long": -121.75565688680798,
    "right_long": -121.73782556127698,
    "top_lat": 38.53997670732033,
    "bottom_lat": 38.52654855404775
}

def update_parking_spots(bounds):
    """Helper function to update parking spots based on bounds"""
    zones = search_zones(
        bounds["left_long"],
        bounds["right_long"],
        bounds["top_lat"],
        bounds["bottom_lat"]
    )
    zones_json = json.loads(zones)
    locations = zones_json['zones']
    
    parking_spots = {}
    get_description(parking_spots, locations)
    return parking_spots

@app.route('/api/data', methods=['GET', 'POST'])
@limiter.limit("30 per minute")  # Allow 30 requests per minute per IP
def get_data():
    # POST: Uses bounds from frontend map view
    # GET: Uses default UC Davis bounds
    # Returns parking spot data in both cases
    print("Received request to /api/data")
    if request.method == 'POST':
        try:
            bounds = request.json
            print("Received bounds:", bounds)
            parking_spots = update_parking_spots(bounds)
            print("Returning spots count:", len(parking_spots))
            return jsonify({"parkingSpots": parking_spots})
        except Exception as e:
            print("Error:", str(e))  # Debug log
            return jsonify({"error": str(e)}), 400
    else:
        parking_spots = update_parking_spots(DEFAULT_BOUNDS)
        return jsonify({"parkingSpots": parking_spots})

@app.route('/api/zones/<zone_code>', methods=['GET'])
@limiter.limit("60 per minute")  # Allow 60 requests per minute per IP
def get_zone_coords(zone_code):
    # Gets coordinates for a specific parking zone
    zones = search_zones(
        DEFAULT_BOUNDS["left_long"],
        DEFAULT_BOUNDS["right_long"],
        DEFAULT_BOUNDS["top_lat"],
        DEFAULT_BOUNDS["bottom_lat"]
    )
    zones_json = json.loads(zones)
    locations = zones_json['zones']
    coords = filter_by_zone(locations, zone_code)
    return jsonify({"coordinates": coords})

# Custom error handler for rate limiting
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "error": "Rate limit exceeded. Please try again later.",
        "message": "Too many requests. Please wait before making more requests.",
        "retry_after": e.description
    }), 429

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)