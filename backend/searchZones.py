import cloudscraper
BASE_URL = "https://aimsmobilepay.com/api/zone/index.php"
# for searching zones in a frame based on amp backend api

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
