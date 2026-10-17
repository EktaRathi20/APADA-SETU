REGION_DATA = {
    "vizag": {"min_lon": 83.15, "min_lat": 17.65, "max_lon": 83.35, "max_lat": 17.75, "name": "Visakhapatnam"},
    "odisha": {"min_lon": 85.75, "min_lat": 19.75, "max_lon": 85.95, "max_lat": 19.85, "name": "Puri, Odisha"},
    "chennai": {"min_lon": 80.20, "min_lat": 12.90, "max_lon": 80.40, "max_lat": 13.10, "name": "Chennai"},
    "bengal": {"min_lon": 88.75, "min_lat": 21.50, "max_lon": 88.95, "max_lat": 21.70, "name": "Sundarbans"},
    "gujarat": {"min_lon": 69.50, "min_lat": 22.30, "max_lon": 69.70, "max_lat": 22.50, "name": "Saurashtra"},
    "paradip": {"min_lon": 86.52, "min_lat": 20.20, "max_lon": 86.72, "max_lat": 20.40, "name": "Paradip, Odisha"},
    "gopalpur": {"min_lon": 84.82, "min_lat": 19.20, "max_lon": 85.02, "max_lat": 19.40, "name": "Gopalpur, Odisha"},
    "kakinada": {"min_lon": 82.15, "min_lat": 16.90, "max_lon": 82.35, "max_lat": 17.10, "name": "Kakinada, Andhra Pradesh"},
    "mumbai": {"min_lon": 72.75, "min_lat": 18.95, "max_lon": 73.05, "max_lat": 19.20, "name": "Mumbai"},
    "bay_of_bengal": {"min_lon": 86.00, "min_lat": 15.00, "max_lon": 89.00, "max_lat": 18.00, "name": "Bay of Bengal Cyclone Zone"},
}

REGION_COORDS = {
    "vizag": {"lat": 17.6868, "lon": 83.2185},
    "odisha": {"lat": 19.8135, "lon": 85.8312},
    "chennai": {"lat": 13.0827, "lon": 80.2707},
    "bengal": {"lat": 21.8380, "lon": 88.8920},
    "gujarat": {"lat": 22.3000, "lon": 69.7000},
    "paradip": {"lat": 20.2644, "lon": 86.6085},
    "gopalpur": {"lat": 19.2584, "lon": 84.9052},
    "kakinada": {"lat": 16.9891, "lon": 82.2475},
    "mumbai": {"lat": 19.0760, "lon": 72.8777},
    "bay_of_bengal": {"lat": 16.5000, "lon": 87.5000},
}

HISTORY_SEARCH_RADIUS_KM = {
    "bay_of_bengal": 400,
}


def get_region_coords(region_key):
    try:
        return REGION_COORDS[region_key]
    except KeyError as error:
        raise ValueError(f"Unsupported region: {region_key}") from error