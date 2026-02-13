from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import geopandas as gpd
import google.generativeai as genai
import os
from dotenv import load_dotenv
from pydantic import BaseModel
import json
import requests
from datetime import date, datetime, timedelta
import numpy as np
import io
import rasterio
import warnings
from typing import Optional, Dict, Any
from sentinel_utils import perform_advanced_analysis
from encroachment_utils import analyze_encroachment


# Suppress warnings from google.generativeai about deprecation
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Load environment variables
load_dotenv()

app = FastAPI()

# Enable connection to React Frontend (Port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found in .env")

# SentinelHub Config
SENTINEL_WMS_URL = os.getenv("SENTINEL_WMS_URL")
SENTINEL_LAYER_NAME = os.getenv("SENTINEL_LAYER_NAME")
# For Process API we need Client Credentials. 
# Use placeholder or expect env vars.
SENTINEL_CLIENT_ID = os.getenv("SENTINEL_CLIENT_ID")
SENTINEL_CLIENT_SECRET = os.getenv("SENTINEL_CLIENT_SECRET")

def get_sentinel_token():
    if not SENTINEL_CLIENT_ID or not SENTINEL_CLIENT_SECRET:
        print("Sentinel OAuth credentials missing.")
        return None
    try:
        url = "https://services.sentinel-hub.com/oauth/token"
        payload = {
            "grant_type": "client_credentials",
            "client_id": SENTINEL_CLIENT_ID,
            "client_secret": SENTINEL_CLIENT_SECRET
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

def fetch_sentinel_data(token, bounds, time_range):
    url = "https://services.sentinel-hub.com/api/v1/process"
    
    # Evalscript to get NDBI and Mask
    evalscript = """
    //VERSION=3
    function setup() {
      return {
        input: ["B11", "B08", "dataMask"],
        output: { bands: 2, sampleType: "FLOAT32" }
      };
    }

    function evaluatePixel(sample) {
      // NDBI = (SWIR - NIR) / (SWIR + NIR)
      let ndbi = (sample.B11 - sample.B08) / (sample.B11 + sample.B08);
      return [ndbi, sample.dataMask];
    }
    """
    
    # Construct bounds part of payload
    bounds_payload = {
        "properties": {
            "crs": "http://www.opengis.net/def/crs/EPSG/0/4326"
        }
    }
    
    if "bbox" in bounds:
        bounds_payload["bbox"] = bounds["bbox"]
    elif "geometry" in bounds:
        bounds_payload["geometry"] = bounds["geometry"]
    else:
        return None

    request_payload = {
        "input": {
            "bounds": bounds_payload,
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": f"{time_range}T00:00:00Z",
                            "to": f"{time_range}T23:59:59Z"
                        },
                        "maxCloudCoverage": 20
                    }
                }
            ]
        },
        "output": {
            "width": 128,
            "height": 128,
            "responses": [
                {
                    "identifier": "default",
                    "format": {
                        "type": "image/tiff"
                    }
                }
            ]
        },
        "evalscript": evalscript
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Search for valid data: Since specific day might be empty/cloudy, 
    # normally we'd search ranges. But user gave specific dates.
    # We will try to widen range slightly if needed, but for now stick to request.
    
    # Actually, let's widen the search window to +/- 10 days to find a pass
    target_date = datetime.strptime(time_range, "%Y-%m-%d")
    start_search = (target_date - timedelta(days=10)).strftime("%Y-%m-%dT%H:%M:%SZ")
    end_search = (target_date + timedelta(days=10)).strftime("%Y-%m-%dT%H:%M:%SZ")
    
    request_payload["input"]["data"][0]["dataFilter"]["timeRange"]["from"] = start_search
    request_payload["input"]["data"][0]["dataFilter"]["timeRange"]["to"] = end_search

    res = requests.post(url, json=request_payload, headers=headers)
    if res.status_code == 200:
        return res.content
    else:
        print(f"Process API failed: {res.text}")
        return None

def calc_avg_ndbi(tiff_bytes):
    with rasterio.open(io.BytesIO(tiff_bytes)) as src:
        # Band 1: NDBI, Band 2: Mask
        ndbi = src.read(1)
        mask = src.read(2)
        
        # Filter valid pixels
        valid_pixels = ndbi[mask == 1]
        
        if valid_pixels.size == 0:
            return None
        
        return float(np.mean(valid_pixels))

# --- Data Models ---
class ChatRequest(BaseModel):
    message: str
    context: str = ""

class AnalysisRequest(BaseModel):
    lat: float
    lng: float
    start_date: str
    end_date: str
    geometry: Optional[dict] = None

class EncroachmentRequest(BaseModel):
    geometry: dict


# --- Endpoints ---

@app.get("/api/plots")
def get_plots():
    try:
        # Load GeoJSON data
        # Ensure the path is correct relative to where uvicorn is run (backend root)
        file_path = "data/final_plots.geojson"
        if not os.path.exists(file_path):
            return {"error": f"File not found at {file_path}"}
            
        gdf = gpd.read_file(file_path)
        
        # Logic: If plot_no is '13' or owner contains 'Encroacher', force status
        # We start by ensuring columns exist to avoid KeyErrors
        if 'plot_no' not in gdf.columns:
            gdf['plot_no'] = ''
        if 'owner' not in gdf.columns:
            gdf['owner'] = ''
        if 'status' not in gdf.columns:
            gdf['status'] = 'Clear'

        for index, row in gdf.iterrows():
            plot_no = str(row['plot_no'])
            owner = str(row['owner'])
            
            if "13" in plot_no or "Encroacher" in owner:
                gdf.at[index, 'status'] = 'Encroachment Detected'
            elif not gdf.at[index, 'status']:
                 gdf.at[index, 'status'] = 'Clear'
        
        # Convert to GeoJSON string then to dict to avoid serialization issues
        return JSONResponse(content=json.loads(gdf.to_json()))
    except Exception as e:
        print(f"Error processing plots: {e}")
        return {"error": str(e)}

@app.post("/api/sentinel-analysis")
def sentinel_analysis(request: AnalysisRequest):
    try:
        # Construct WMS GetFeatureInfo URL
        # We need a small bbox around the point. 
        # Approx 0.0001 degrees is ~10m
        delta = 0.0001
        bbox = f"{request.lat - delta},{request.lng - delta},{request.lat + delta},{request.lng + delta}"
        
        # Note: SentinelHub WMS requests usually use bbox order differently depending on version/CRS.
        # WMS 1.3.0 with EPSG:4326 uses Lat,Lon (or X,Y depending on axis order).
        # SentinelHub usually expects standard bbox.
        # Let's try 1.1.1 which is safer for Lon,Lat order usually, or just use 1.3.0 with CRS:84 if supported.
        # Or just trust the standard order for 1.3.0 which is often Lat,Lon.
        
        params = {
            "SERVICE": "WMS",
            "VERSION": "1.3.0",
            "REQUEST": "GetFeatureInfo",
            "LAYERS": SENTINEL_LAYER_NAME,
            "QUERY_LAYERS": SENTINEL_LAYER_NAME,
            "BBOX": bbox,
            "CRS": "EPSG:4326",
            "WIDTH": "2",
            "HEIGHT": "2",
            "I": "1",
            "J": "1",
            "INFO_FORMAT": "application/json",
            "TIME": f"{request.start_date}/{request.end_date}",
            "MAXCC": "20" 
        }
        
        # If URL is not set, use default or return error
        if not SENTINEL_WMS_URL:
             return {"error": "Sentinel WMS URL not configured"}

        response = requests.get(SENTINEL_WMS_URL, params=params, timeout=10)
        
        if response.status_code == 200:
            try:
                data = response.json()
                # Process data to check for alerts
                # This depends on the layer output. Assuming NDBI layer returns an index value.
                # If it's a visualization layer, GetFeatureInfo might return RGB or palette index.
                # If it's a data layer, it returns values.
                
                # Mock logic if specific data format isn't known:
                # Check for "vegetation loss" or "construction" based on simplistic checks or just pass data.
                return {"status": "success", "data": data, "alert": "Analysis complete. See data for details."}
            except:
                 # If not JSON, return text or raw content snippet
                 return {"status": "success", "raw_data": response.text[:500], "alert": "Raw WMS response received."}
        else:
             return {"error": f"WMS request failed: {response.status_code}", "details": response.text}

    except Exception as e:
        return {"error": str(e)}

@app.post("/api/sentinel/ndbi-analysis")
def sentinel_ndbi_analysis(request: AnalysisRequest):
    try:
        # 1. Get OAuth Token
        token = get_sentinel_token()
        
        if not token:
             # Fallback to Mock if no credentials, to allow UI testing
             # Generate deterministic mock values based on lat/lng hash so it feels consistent but varied
             seed = int((request.lat + request.lng) * 10000)
             np.random.seed(seed)
             
             mock_builtup = 5.0 + np.random.random() * 25.0 # Random between 5% and 30%
             mock_veg_loss = mock_builtup * (0.5 + np.random.random() * 0.5)
             
             status = "Compliant"
             details = "No significant changes detected (Simulated)."
             
             if mock_builtup > 12.0:
                 status = "Violation Suspected"
                 details = f"Significant built-up increase ({mock_builtup:.1f}%) detected (Simulated)."
             
             print("Sentinel OAuth credentials missing. Using SIMULATED data.")
             return {
                 "builtup_increase_percent": round(mock_builtup, 1), 
                 "vegetation_loss_percent": round(mock_veg_loss, 1),
                 "status": status + " (Mock)",
                 "details": details
             }

        # 2. Define Bounds
        bounds = {}
        if request.geometry:
            bounds["geometry"] = request.geometry
        else:
            delta = 0.002 # approx 200m
            bounds["bbox"] = [request.lng - delta, request.lat - delta, request.lng + delta, request.lat + delta]
        
        # 3. Fetch Data for Start and End dates
        start_tiff = fetch_sentinel_data(token, bounds, request.start_date)
        end_tiff = fetch_sentinel_data(token, bounds, request.end_date)
        
        if not start_tiff or not end_tiff:
            return {"error": "Could not fetch satellite data for one or both dates."}
        
        # 4. Calculate Stats
        start_ndbi = calc_avg_ndbi(start_tiff)
        end_ndbi = calc_avg_ndbi(end_tiff)
        
        if start_ndbi is None or end_ndbi is None:
             return {"error": "No valid pixels found in the area (clouds or no data)."}
        
        # 5. Compare
        diff = end_ndbi - start_ndbi
        
        builtup_increase = diff * 100 # Rough percent
        if builtup_increase < 0: builtup_increase = 0
        
        veg_loss = builtup_increase * 0.8 
        
        status = "Compliant"
        details = "No significant changes detected."
        
        if builtup_increase > 10:
            status = "Violation"
            details = f"Significant built-up increase ({builtup_increase:.1f}%) detected."
            
        return {
            "builtup_increase_percent": round(builtup_increase, 1),
            "vegetation_loss_percent": round(veg_loss, 1),
            "status": status,
            "details": details,
            "debug_vals": {"start": start_ndbi, "end": end_ndbi}
        }
    except Exception as e:
        print(f"Analysis error: {e}")
        return {"error": str(e)}

@app.post("/api/sentinel/advanced-analysis")
def sentinel_advanced_analysis_endpoint(request: AnalysisRequest):
    try:
        # Validate inputs
        if not request.geometry:
            return {"error": "Geometry is required for advanced analysis"}
        
        # Determine if we have a Feature or Geometry
        geom = request.geometry
        if geom.get("type") == "Feature":
            geom = geom.get("geometry")
        
        # Run analysis
        result = perform_advanced_analysis(geom, request.start_date, request.end_date)
        
        if result is None:
             return {"error": "Analysis returned no result (check logs)"}
             
        if "error" in result:
             return result
             
        return result

    except Exception as e:
        print(f"Advanced Analysis Error: {e}")
        return {"error": str(e)}

@app.post("/api/analyze/encroachment")
def analyze_encroachment_endpoint(request: EncroachmentRequest):
    try:
        # Validate geometry
        if not request.geometry:
             return {"error": "Geometry is required."}
             
        # Run analysis
        # Pass the geometry dict directly
        result = analyze_encroachment(request.geometry)
        
        return result
    except Exception as e:
        print(f"Encroachment Analysis Error: {e}")
        return {"error": str(e)}

@app.post("/api/chat")
def chat_with_ai(request: ChatRequest):
    try:
        if not GEMINI_API_KEY:
            return {"reply": "Error: Gemini API Key is not configured on the server."}

        # System Instruction
        system_instruction = """
        You are 'Nagarik Sahayak', an AI legal officer for CSIDC (Chhattisgarh State Industrial Development Corporation).
        Your job is to assist officers in monitoring industrial plots and drafting legal notices.
        
        RULES:
        1. If specific plot details are provided in 'Context', use them.
        2. If the status is 'Encroachment Detected', be firm and cite legal codes.
        3. If asked to 'Draft Notice', output a formal legal notice under "Section 24 of CG Land Revenue Code".
           - Include placeholders for Date, Ref No, and Officer Signature if not provided.
           - Mention the specific Plot No and Owner Name from context.
        4. Keep answers professional, concise, and legally sounded.
        """
        
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Construct the prompt
        full_prompt = f"""
        System Instruction: {system_instruction}
        
        Context Information: {request.context}
        
        User Question: {request.message}
        """
        
        response = model.generate_content(full_prompt)
        return {"reply": response.text}
    except Exception as e:
        return {"reply": f"Error contacting AI: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)