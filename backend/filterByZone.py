# for filtering function by zone code
def filter_by_zone(locations, zone_code):
    filtered_locations = [x for x in locations if x['code'] == zone_code]
    cords = []
    for location in filtered_locations:
        for pos in location['positions']:
            # gets the coordinates of the filtered parking spots by zone code
            cords.append((pos['lat'], pos['lng']))
    return cords

