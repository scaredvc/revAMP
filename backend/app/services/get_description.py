from typing import Dict, Any, List


def get_description(description_map: Dict[str, Any], locations: List[Dict[str, Any]]) -> None:
    for parking_info in locations:
        description_map[parking_info["description"]] = {
            "code": parking_info.get("code"),
            "ext_description": parking_info.get("ext_description"),
            "positions": parking_info.get("positions", []),
            "additional_info": parking_info.get("additional_info"),
        }

