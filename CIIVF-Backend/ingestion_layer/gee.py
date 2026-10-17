import os
import requests
import ee
from datetime import datetime
from dotenv import load_dotenv
from ingestion_layer.constant import REGION_DATA
from ingestion_layer.constant import REGION_COORDS

load_dotenv()

def init_gee():    
    project_id = os.environ.get("GEE_PROJECT_ID")
    if not project_id:
        raise ValueError("GEE_PROJECT_ID missing from environment variables.")
    ee.Initialize(project=project_id)

def fetch_sar_imagery(region_key="vizag"):
    target = REGION_DATA.get(region_key, REGION_DATA["vizag"])
    aoi = ee.Geometry.BBox(
        target["min_lon"], target["min_lat"],
        target["max_lon"], target["max_lat"]
    )
    
    collection = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(aoi)
        .filter(ee.Filter.listContains("transmitterReceiverPolarisation", "VV"))
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .select("VV")
        .sort("system:time_start", False)
    )
    
    image = collection.first()
    vis_params = {"min": -25.0, "max": 0.0, "dimensions": 768, "region": aoi, "format": "png"}
    thumb_url = image.getThumbURL(vis_params)
    
    response = requests.get(thumb_url)
    response.raise_for_status()
    return response.content, target