import requests
import json

def test_encroachment():
    url = "http://localhost:8000/api/analyze/encroachment"
    
    # Dummy Geometry (A square plot somewhere)
    # Using a real coordinate - e.g. Eiffel Tower or just a random field in India
    # Let's use a coordinate from the user's area (Raipur/CSIDC) if possible, or just generic.
    # 21.2845, 81.7212 (From earlier map center)
    
    # Create a small polygon around it
    center_lat = 21.2845
    center_lon = 81.7212
    delta = 0.0005
    
    payload = {
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [center_lon - delta, center_lat - delta],
                [center_lon + delta, center_lat - delta],
                [center_lon + delta, center_lat + delta],
                [center_lon - delta, center_lat + delta],
                [center_lon - delta, center_lat - delta]
            ]]
        }
    }
    
    try:
        print("Sending request...")
        res = requests.post(url, json=payload)
        
        if res.status_code == 200:
            data = res.json()
            print("Status:", data.get("status"))
            if data.get("base_image_url"):
                print("Image URL received (length):", len(data["base_image_url"]))
            print("Detections:", len(data.get("detections", [])))
            # print(json.dumps(data, indent=2))
        else:
            print("Error:", res.status_code, res.text)
            
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    test_encroachment()
