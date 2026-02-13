import os
import requests
import json
import numpy as np
import rasterio
from rasterio.features import rasterize
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
from datetime import datetime, timedelta
import io

# Helper to get token
def get_sentinel_token():
    client_id = os.getenv("SENTINEL_CLIENT_ID")
    client_secret = os.getenv("SENTINEL_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        print("Sentinel OAuth credentials missing.")
        return None
        
    try:
        url = "https://services.sentinel-hub.com/oauth/token"
        payload = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret
        }
        res = requests.post(url, data=payload)
        if res.status_code == 200:
            return res.json()['access_token']
        else:
            print(f"Token error: {res.text}")
            return None
    except Exception as e:
        print(f"Token exception: {e}")
        return None

def fetch_multiband_image(token, bbox, time_range):
    """
    Fetches B04, B08, B11 for the given bbox and time range.
    Returns: numpy array of shape (height, width, 4) -> [B04, B08, B11, mask]
    """
    url = "https://services.sentinel-hub.com/api/v1/process"
    
    # Evalscript to get raw bands
    evalscript = """
    //VERSION=3
    function setup() {
      return {
        input: ["B04", "B08", "B11", "dataMask"],
        output: { bands: 4, sampleType: "FLOAT32" }
      };
    }

    function evaluatePixel(sample) {
      return [sample.B04, sample.B08, sample.B11, sample.dataMask];
    }
    """
    
    # Widen search window slightly (±5 days) to ensure cloud-free data if exact date is empty
    target_date = datetime.strptime(time_range, "%Y-%m-%d")
    start_search = (target_date - timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    end_search = (target_date + timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Payload
    payload = {
        "input": {
            "bounds": {
                "bbox": bbox,
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
            },
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "timeRange": {"from": start_search, "to": end_search},
                    "maxCloudCoverage": 20
                }
            }]
        },
        "output": {
            # Resolution is roughly 10m. width/height will be calculated by SH if we specify res, 
            # OR we specify width/height. 
            # To get ~10m resolution, we can request resx/resy in meters if using EPSG:3857, 
            # but for 4326 it's degrees.
            # Easiest is to specify dimensions like 256x256 or let it auto-calculate?
            # Process API defaults to 0.0001 deg/px if not specified? No.
            # Let's use specific resolution in meters (approx) by projecting? 
            # No, let's keep it simple: usage of "resx": 10, "resy": 10 units? 
            # For 4326, 10m is approx 0.0001 deg.
            "resx": 0.0001,
            "resy": 0.0001,
            "responses": [{
                "identifier": "default",
                "format": {"type": "image/tiff"}
            }]
        },
        "evalscript": evalscript
    }
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    res = requests.post(url, json=payload, headers=headers)
    if res.status_code != 200:
        print(f"Sentinel API Error: {res.text}")
        return None
        
    # Read TIFF
    with rasterio.open(io.BytesIO(res.content)) as src:
        # returns (bands, height, width) -> transpose to (h, w, bands)
        img = src.read()
        img = np.transpose(img, (1, 2, 0))
        transform = src.transform
        return img, transform

def perform_advanced_analysis(plot_geometry, start_date, end_date):
    """
    Performs change detection on Plot Logic and Encroachment Logic.
    plot_geometry: GeoJSON dict (WGS84)
    """
    token = get_sentinel_token()
    if not token:
        return {"error": "Sentinel OAuth failed"}

    # 1. Prepare Geometry and Buffer
    # Convert GeoJSON to Shapely
    geom_shape = shape(plot_geometry)
    
    # Create Buffer (Approx 20-30 meters). 
    # In WGS84 (degrees), 1 deg ~ 111km -> 1m ~ 0.000009 deg
    # 30m ~ 0.00027 deg
    buffer_deg = 0.00027
    buffered_shape = geom_shape.buffer(buffer_deg)
    
    # Calculate BBox for the Buffered Shape (to fetch the image)
    minx, miny, maxx, maxy = buffered_shape.bounds
    bbox = [minx, miny, maxx, maxy]
    
    # 2. Fetch Images
    start_data = fetch_multiband_image(token, bbox, start_date)
    end_data = fetch_multiband_image(token, bbox, end_date)
    
    if not start_data or not end_data:
        return {"error": "Failed to fetch satellite imagery"}
        
    start_img, transform = start_data
    end_img, _ = end_data 
    
    # Ensure shapes match (SentinelHub might return slightly different dims?? Should be same if bbox/res same)
    if start_img.shape != end_img.shape:
        # Resize or crop? Usually they match if request is identical.
        # Fallback: crop to min size
        h = min(start_img.shape[0], end_img.shape[0])
        w = min(start_img.shape[1], end_img.shape[1])
        start_img = start_img[:h, :w, :]
        end_img = end_img[:h, :w, :]

    # 3. Create Masks using Rasterio
    # Shape of image
    h, w, _ = start_img.shape
    
    # Mask 1: The Plot (Official Geometry)
    # rasterize takes [(shape, value)]
    mask_plot = rasterize(
        [(geom_shape, 1)],
        out_shape=(h, w),
        transform=transform,
        fill=0,
        dtype=np.uint8
    )
    
    # Mask 2: The Encroachment Zone (Buffer - Plot)
    # We rasterize the Buffer, then subtract Plot
    mask_buffer = rasterize(
        [(buffered_shape, 1)],
        out_shape=(h, w),
        transform=transform,
        fill=0,
        dtype=np.uint8
    )
    mask_encroachment = mask_buffer - mask_plot # 1 where buffer is, 0 where plot is
    mask_encroachment[mask_encroachment < 0] = 0 # Safety
    
    # 4. Compute Indices (NDVI, NDBI) and Changes
    # Bands: 0:B04(Red), 1:B08(NIR), 2:B11(SWIR), 3:Mask
    
    def get_indices(img):
        red = img[:,:,0]
        nir = img[:,:,1]
        swir = img[:,:,2]
        data_mask = img[:,:,3]
        
        # Avoid div by zero
        ndvi = np.divide((nir - red), (nir + red), where=(nir+red)!=0)
        ndbi = np.divide((swir - nir), (swir + nir), where=(swir+nir)!=0)
        
        return ndvi, ndbi, data_mask

    s_ndvi, s_ndbi, s_mask = get_indices(start_img)
    e_ndvi, e_ndbi, e_mask = get_indices(end_img)
    
    # Combined Valid Mask (valid in both dates)
    valid_mask = (s_mask == 1) & (e_mask == 1)
    
    # 5. Analyze INSIDE Plot (Vegetation Loss)
    # Filter by Plot Mask AND Valid Data
    plot_pixels = (mask_plot == 1) & valid_mask
    
    if np.sum(plot_pixels) == 0:
        veg_loss_pct = 0
        builtup_inc_pct = 0
    else:
        # Vegetation Loss: ROI where Start NDVI > 0.3 AND (Start - End) > 0.1
        # Or simply Mean NDVI change
        s_mean_ndvi = np.mean(s_ndvi[plot_pixels])
        e_mean_ndvi = np.mean(e_ndvi[plot_pixels])
        
        # Loss % relative to start? Or raw drop? 
        # User requested "Vegetation Loss %". 
        # Let's do % drop in Mean NDVI, or % of area that lost vegetation.
        # Let's do % drop in mean NDVI for now, clamped to 0-100.
        veg_change = s_mean_ndvi - e_mean_ndvi
        veg_loss_pct = max(0, veg_change * 100) # Rough scale
        
        # Built-up Increase Inside Loop
        s_mean_ndbi = np.mean(s_ndbi[plot_pixels])
        e_mean_ndbi = np.mean(e_ndbi[plot_pixels])
        builtup_inc_pct = max(0, (e_mean_ndbi - s_mean_ndbi) * 100)

    # 6. Analyze OUTSIDE Plot (Encroachment)
    # Filter by Encroachment Mask AND Valid Data
    enc_pixels = (mask_encroachment == 1) & valid_mask
    
    encroachment_size_sqm = 0
    status = "Compliant"
    
    if np.sum(enc_pixels) > 0:
        # Violation: If NDBI increased significantly in the buffer zone.
        # Or if NDBI in buffer is High (> 0, typically built-up) and wasn't before?
        # Let's look for pixels where NDBI increased by > 0.1 AND End NDBI > -0.1 (is built-up)
        
        # Define "New Built-up" pixels
        diff_ndbi = e_ndbi - s_ndbi
        new_build_mask = (diff_ndbi > 0.15) & (e_ndbi > -0.05) & enc_pixels
        
        pixel_count = np.sum(new_build_mask)
        # 1 pixel ~ 10m x 10m = 100 sqm
        encroachment_size_sqm = int(pixel_count * 100)
        
        if encroachment_size_sqm > 200: # Threshold: 200 sqm
            status = "Violation"
    
    # Refine Status based on Veg Loss
    if veg_loss_pct > 15: # Threshold
         status = "Environmental Alert" if status == "Compliant" else status + " + Env Alert"

    return {
        "area_sqm": int(geom_shape.area * 111000 * 111000), # Rough degrees to meters
        "vegetation_loss": float(round(veg_loss_pct, 2)),
        "builtup_increase": float(round(builtup_inc_pct, 2)),
        "encroachment_area": int(encroachment_size_sqm),
        "status": status,
        "plot_id": plot_geometry.get("properties", {}).get("plot_no", "Unknown") 
        # Note: plot_geometry passsed might not have properties if not selected from FeatureCollection properly,
        # but we handle what we get.
    }
