def get_description(description_list,location):
    for parkingInfo in location:
        description_list[parkingInfo['description']] = {
            'ext_description': parkingInfo['ext_description'],
            'positions': parkingInfo['positions'],
            'additional_info': parkingInfo['additional_info']
        }