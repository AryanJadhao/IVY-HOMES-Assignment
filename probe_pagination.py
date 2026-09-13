import requests

BASE_URL = "https://solve.ivy.homes"
API_KEY = "IVY26-1F31BF2C8119"
GLOBAL_HEADERS = {"X-API-Key": API_KEY}

l_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "demo1@ivy.homes", "password": "2c1fbd9692"}, headers=GLOBAL_HEADERS)
token = l_resp.json().get('access_token')
GLOBAL_HEADERS["Authorization"] = f"Bearer {token}"

# Try offset
resp1 = requests.get(f"{BASE_URL}/v1/listings", params={"offset": 50}, headers=GLOBAL_HEADERS)
print("With offset=50:", resp1.json()['results'][0]['listing_id'])

resp2 = requests.get(f"{BASE_URL}/v1/listings", params={"page": 2}, headers=GLOBAL_HEADERS)
print("With page=2:", resp2.json()['results'][0]['listing_id'])

# Check what the first record without params is
resp0 = requests.get(f"{BASE_URL}/v1/listings", headers=GLOBAL_HEADERS)
print("Without params:", resp0.json()['results'][0]['listing_id'])
