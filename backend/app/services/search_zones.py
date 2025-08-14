import cloudscraper

BASE_URL = "https://aimsmobilepay.com/api/zone/index.php"


def search_zones(left_long: float, right_long: float, top_lat: float, bottom_lat: float) -> str:
    scraper = cloudscraper.create_scraper()
    payload = {
        "cmd": "get_zones_in_frame",
        "left_long": str(left_long),
        "right_long": str(right_long),
        "top_lat": str(top_lat),
        "bottom_lat": str(bottom_lat),
    }
    response = scraper.post(BASE_URL, data=payload)
    return response.text

