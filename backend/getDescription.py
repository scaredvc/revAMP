# function used to get the description of the parking lot via the api
def get_description(description_list,location):
    for parkingInfo in location:
        description_list[parkingInfo['description']] = {
            'ext_description': parkingInfo['ext_description'],
            'positions': parkingInfo['positions'],
            'additional_info': parkingInfo['additional_info']
        }