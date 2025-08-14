from typing import List, Tuple, Dict, Any


def filter_by_zone(locations: List[Dict[str, Any]], zone_code: str) -> List[Tuple[float, float]]:
    filtered_locations = [x for x in locations if x.get("code") == zone_code]
    coords: List[Tuple[float, float]] = []
    for location in filtered_locations:
        for pos in location.get("positions", []):
            coords.append((pos["lat"], pos["lng"]))
    return coords

