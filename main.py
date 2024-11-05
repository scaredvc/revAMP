import cloudscraper
import json
from pprint import pprint
import string

BASE_URL = "https://aimsmobilepay.com/api/zone/index.php"


def search_zones(left_long, right_long, top_lat, bottom_lat):
    scraper = cloudscraper.create_scraper()

    payload = {

        "cmd": "get_zones_in_frame",
        "left_long": str(left_long),
        "right_long": str(right_long),
        "top_lat": str(top_lat),
        "bottom_lat": str(bottom_lat)
    }

    response = scraper.post(BASE_URL, data=payload)

    return response.text

parkingSpotDescription = {}

def get_description(location):
    for parkingInfo in location:
        parkingSpotDescription[parkingInfo['description']] = {
            'ext_description': parkingInfo['ext_description'],
            'positions': parkingInfo['positions'],
            'additional_info': parkingInfo['additional_info']
        }

zones = search_zones(-121.75565688680798, -121.73782556127698, 38.53997670732033, 38.52654855404775)
zones_json = json.loads(zones)
locations = zones_json['zones']
get_description(locations)
pprint(parkingSpotDescription)



# C_ZONE_CODE = "UCD_CZONE"

# filtered_locations = [x for x in locations if x['code'] == C_ZONE_CODE]
# cords = []



# for location in filtered_locations:
#     for pos in location['positions']:
#         cords.append((pos['lat'], pos['lng']))

# pprint(cords)