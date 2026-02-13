import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_MAPS_API_KEY")
print(f"API Key from env: {api_key}")

if not api_key:
    print("Trying hardcoded key (if any)...")

url = "https://maps.googleapis.com/maps/api/staticmap"
params = {
    "center": "21.2845,81.7212",
    "zoom": 15,
    "size": "600x400",
    "key": api_key
}

res = requests.get(url, params=params)
print(f"Status: {res.status_code}")
if res.status_code != 200:
    print(res.text)
else:
    print("Success! Image size:", len(res.content))
