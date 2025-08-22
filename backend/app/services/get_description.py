from typing import Dict, Any, List
import re


def clean_description(description: str) -> str:
    """Clean HTML paragraph tags and entities from parking descriptions"""
    if not description:
        return ""

    # Remove paragraph tags
    cleaned = re.sub(r'</?p[^>]*>', '', description)

    # Replace HTML entities
    cleaned = cleaned.replace('&nbsp;', ' ')

    # Clean up extra whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    return cleaned


def get_description(description_map: Dict[str, Any], locations: List[Dict[str, Any]]) -> None:
    for parking_info in locations:
        raw_description = parking_info.get("description", "")
        raw_ext_description = parking_info.get("ext_description", "")

        description_map[clean_description(raw_description)] = {
            "code": parking_info.get("code"),
            "ext_description": clean_description(raw_ext_description),
            "positions": parking_info.get("positions", []),
            "additional_info": clean_description(parking_info.get("additional_info", "")),
        }