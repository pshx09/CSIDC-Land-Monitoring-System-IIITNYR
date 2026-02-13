import os
import math
import requests
import io
import numpy as np
from PIL import Image
from shapely.geometry import Polygon, box, shape
from ultralytics import YOLO
import base64

# Constants
TILE_SIZE = 256

def get_google_maps_key():
    return os.getenv("GOOGLE_MAPS_API_KEY")

# --- Coordinate Conversion Logic (Web Mercator) ---

def latlon_to_world(lat, lon):
    """
    Project lat/lon to World Coordinates (0-256 for zoom 0).
    """
    sin_y = math.sin(math.radians(lat))
    sin_y = min(max(sin_y, -0.9999), 0.9999)
    
    x = TILE_SIZE * (0.5 + lon / 360)
    y = TILE_SIZE * (0.5 - math.log((1 + sin_y) / (1 - sin_y)) / (4 * math.pi))
    return x, y

def world_to_latlon(x, y):
    """
    Unproject World Coordinates to Lat/Lon.
    """
    lon = (x / TILE_SIZE - 0.5) * 360
    lat_rad = math.atan(math.sinh(2 * math.pi * (0.5 - y / TILE_SIZE)))
    lat = math.degrees(lat_rad)
    return lat, lon

def get_pixel_coordinates(lat, lon, center_lat, center_lon, zoom, image_width, image_height, scale=1):
    """
    Convert a specific Lat/Lon to Pixel Coordinates (px, py) on the static map image.
    """
    scale_factor = (2 ** zoom) * scale
    
    # World Coordinates of target point
    wx, wy = latlon_to_world(lat, lon)
    px = wx * scale_factor
    py = wy * scale_factor
    
    # World Coordinates of center point
    center_wx, center_wy = latlon_to_world(center_lat, center_lon)
    center_px = center_wx * scale_factor
    center_py = center_wy * scale_factor
    
    # Calculate offset relative to center of image
    # Image center is at (image_width/2, image_height/2)
    dx = px - center_px
    dy = py - center_py
    
    final_x = (image_width / 2) + dx
    final_y = (image_height / 2) + dy
    
    return final_x, final_y

def pixel_to_latlon_coords(px, py, center_lat, center_lon, zoom, image_width, image_height, scale=1):
    """
    Convert Pixel Coordinates (px, py) on the static map image back to Lat/Lon.
    """
    scale_factor = (2 ** zoom) * scale # 256 * 2^zoom
    
    # Center in World Pixel Coords
    center_wx, center_wy = latlon_to_world(center_lat, center_lon)
    center_px = center_wx * scale_factor
    center_py = center_wy * scale_factor
    
    # Offset from image center
    dx = px - (image_width / 2)
    dy = py - (image_height / 2)
    
    # Target in World Pixel Coords
    target_px = center_px + dx
    target_py = center_py + dy
    
    # Back to World Coords (0-256)
    target_wx = target_px / scale_factor
    target_wy = target_py / scale_factor
    
    return world_to_latlon(target_wx, target_wy)

# --- Main Logic ---

def fetch_static_map(center_lat, center_lon, zoom, width=640, height=640, scale=2):
    """
    Fetch image from Google Static Maps API.
    Scale=2 returns high-res (Retina) images, effectively double raw pixels.
    """
    api_key = get_google_maps_key()
    if not api_key:
        print("Error: GOOGLE_MAPS_API_KEY not found in environment.")
        return None, None
    print(f"Using Google Maps API Key: {api_key[:5]}...{api_key[-5:]}")

    url = "https://maps.googleapis.com/maps/api/staticmap"
    params = {
        "center": f"{center_lat},{center_lon}",
        "zoom": zoom,
        "size": f"{width}x{height}",
        "maptype": "satellite",
        "scale": scale,
        "key": api_key
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        print(f"Static Map Fetched: {response.url}")
        image = Image.open(io.BytesIO(response.content))
        return image, response.url
    else:
        print(f"Static Map Error: {response.status_code} - {response.text}")
        return None, None

def analyze_encroachment(plot_geojson):
    """
    Main entry point.
    1. Parse GeoJSON Polygon.
    2. Determine Center & Zoom.
    3. Fetch Image.
    4. Detect Objects (YOLO).
    5. Check Overlap.
    """
    # 1. Parse Geometry
    plot_shape = shape(plot_geojson)
    bounds = plot_shape.bounds # (minx, miny, maxx, maxy)
    minx, miny, maxx, maxy = bounds
    
    center_lon = (minx + maxx) / 2
    center_lat = (miny + maxy) / 2
    
    # Determine basic zoom. For plots ~1000sqm, zoom 18-19 is good.
    # We can try to fit bounds, but for now fixed zoom 19 is usually detailed enough.
    zoom = 19
    width, height = 640, 640
    scale = 2 # High res
    
    # 2. Fetch Image
    image, image_url = fetch_static_map(center_lat, center_lon, zoom, width, height, scale)
    
    results = {
        "base_image_url": None,
        "official_boundary_pixels": [],
        "detections": [],
        "status": "Analysis Failed"
    }

    if image is None:
        results["error"] = "Could not fetch satellite image."
        return results

    # Convert Image to Base64 for Frontend
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    results["base_image_url"] = f"data:image/png;base64,{img_str}"
    
    # 3. Convert Plot Boundary to Pixels (for visualization)
    # Handle Polygon or MultiPolygon. Assuming Polygon for simplicity of 'exterior'.
    if plot_shape.geom_type == 'Polygon':
        coords = list(plot_shape.exterior.coords)
        pixel_coords = []
        for lon, lat in coords:
            # Note: GeoJSON is (lon, lat) usually
            px, py = get_pixel_coordinates(lat, lon, center_lat, center_lon, zoom, width, height, scale)
            pixel_coords.append([px, py])
        results["official_boundary_pixels"] = pixel_coords
        
        # Create a Shapely Polygon in PIXEL SPACE for easier intersection logic?
        # NO. Better to do intersection in Lat/Lon (Geographic Space) for accuracy logic,
        # OR consistently in one space.
        # User requested: "Convert YOLO detected Bounding Boxes (Pixel) into Geo-referenced Polygons (Lat/Lon)"
        # So we will do intersection in Lat/Lon.
    
    # 4. YOLO Detection
    # Load model (automatic download on first run)
    model = YOLO("yolov8n.pt") 
    
    # Run inference
    # Detect generic classes. In COCO, 'house' isn't a class. 'potted plant'?? No.
    # standard yolov8n classes: person, bicycle, car, motorcycle, airplane, bus, train, truck, boat, traffic light, fire hydrant, stop sign, parking meter, bench, bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe, backpack, umbrella, handbag, tie, suitcase, frisbee, skis, snowboard, sports ball, kite, baseball bat, baseball glove, skateboard, surfboard, tennis racket, bottle, wine glass, cup, fork, knife, spoon, bowl, banana, apple, sandwich, orange, broccoli, carrot, hot dog, pizza, donut, cake, chair, couch, potted plant, bed, dining table, toilet, tv, laptop, mouse, remote, keyboard, cell phone, microwave, oven, toaster, sink, refrigerator, book, clock, vase, scissors, teddy bear, hair drier, toothbrush
    # Closest to "structure" might be... nothing good in COCO. 
    # Maybe we detect 'car', 'truck' (vehicles encroaching) or just assume any detection is interesting?
    # For meaningful "structure" detection, we need a custom model.
    # However, for this task, the USER said: "detect classes: 'building', 'house' ... if standard YOLO, stick to standard classes or just detect all objects for the demo."
    # Let's detect everything and flag "potential obstruction".
    
    detections = model(image)
    
    detected_objects = []
    
    for result in detections:
        boxes = result.boxes.xyxy.cpu().numpy() # x1, y1, x2, y2
        classes = result.boxes.cls.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()
        names = result.names
        
        for box_coord, cls, conf in zip(boxes, classes, confs):
            x1, y1, x2, y2 = box_coord
            class_name = names[int(cls)]
            
            # Convert BBox pixels to Lat/Lon Polygon
            # TL, TR, BR, BL
            corners = [
                (x1, y1), (x2, y1), (x2, y2), (x1, y2)
            ]
            
            geo_corners = []
            for px, py in corners:
                lat, lon = pixel_to_latlon_coords(px, py, center_lat, center_lon, zoom, width, height, scale)
                geo_corners.append((lon, lat)) # GeoJSON format
            
            # Close the loop
            geo_corners.append(geo_corners[0])
            
            obj_polygon = Polygon(geo_corners)
            
            # 5. Encroachment Logic
            # Check if Object intersects with Plot?
            # Encroachment usually means: A structure from OUTSIDE extending INSIDE (Encroachment ONTO plot) 
            # OR structure from INSIDE extending OUTSIDE (Expansion)?
            # User said: "If a detected Structure (red box) has a significant area *outside* the Official Plot Polygon (green boundary), flag it as 'Potential Encroachment'"
            # This implies checking if the object is NOT fully inside the plot.
            # i.e. Difference area > 0?
            
            # Let's say we only care about objects that overlap with the boundary.
            
            is_encroaching = False
            encroachment_pct = 0.0
            
            if obj_polygon.intersects(plot_shape):
                # Calculate what % is OUTSIDE
                intersection_area = obj_polygon.intersection(plot_shape).area
                total_area = obj_polygon.area
                
                outside_area = total_area - intersection_area
                pct_outside = (outside_area / total_area) * 100
                
                # If significantly outside (e.g. > 10%) but also inside (intersection > 0)
                # Or just any part outside?
                if pct_outside > 5: 
                    is_encroaching = True
                    encroachment_pct = pct_outside
            else:
                # Object is fully outside -> Is it an encroachment? 
                # If it's fully outside, it's just a neighbor.
                # Encroachment implies crossing the line.
                # Unless we are checking a larger ROI? 
                # User instructions: "If a detected Structure ... has a significant area *outside* ... flag it"
                # This could mean we claim the plot is the "allowed area". Anything built is "structure".
                # If structure is partially inside and partially outside?
                pass
            
            detected_objects.append({
                "class": class_name,
                "confidence": float(conf),
                "bbox_pixel": [float(x1), float(y1), float(x2), float(y2)],
                "is_encroaching": is_encroaching,
                "encroachment_percentage": round(encroachment_pct, 2)
            })

    results["detections"] = detected_objects
    results["status"] = "Success"
    
    return results
