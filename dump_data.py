import requests
import json
import os
import time

BASE_URL = "https://solve.ivy.homes"
API_KEY = "IVY26-1F31BF2C8119"
DATA_DIR = "data"

os.makedirs(DATA_DIR, exist_ok=True)

GLOBAL_HEADERS = {
    "X-API-Key": API_KEY
}

def dump_endpoint(endpoint_name, endpoint_path):
    print(f"Starting dump for {endpoint_name}...", flush=True)
    offset = 0
    all_records = []
    
    while True:
        params = {'offset': offset}
        resp = requests.get(f"{BASE_URL}{endpoint_path}", params=params, headers=GLOBAL_HEADERS)
        
        if resp.status_code != 200:
            print(f"  [!] HTTP {resp.status_code} at offset {offset}", flush=True)
            break
            
        data = resp.json()
        batch = data.get('results', [])
            
        if not batch:
            print("  No more batch records.", flush=True)
            break
            
        all_records.extend(batch)
        print(f"  Fetched offset {offset}, records this batch: {len(batch)}. Total so far: {len(all_records)}", flush=True)
        
        total = data.get('total', 0)
        if len(all_records) >= total:
            print(f"  Reached reported total {total}", flush=True)
            break
            
        offset += len(batch)
        time.sleep(0.1)
        
    with open(f"{DATA_DIR}/{endpoint_name}.json", "w") as f:
        json.dump(all_records, f, indent=2)
    print(f"Finished {endpoint_name}. Total records fetched: {len(all_records)}, Unique IDs: {len(set([x.get('listing_id', x.get('project_id')) for x in all_records]))}\n", flush=True)
    return all_records

def main():
    print("Logging in...", flush=True)
    l_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": "demo1@ivy.homes", "password": "2c1fbd9692"}, headers=GLOBAL_HEADERS)
    if l_resp.status_code == 200:
        token = l_resp.json().get('access_token')
        GLOBAL_HEADERS["Authorization"] = f"Bearer {token}"
        print("Login successful.\n", flush=True)
    else:
        print("Login failed!", flush=True)
        return

    dump_endpoint("listings", "/v1/listings")
    dump_endpoint("rentals", "/v1/rentals")
    dump_endpoint("projects", "/v1/projects")
    
    print("\nData extraction complete!", flush=True)

if __name__ == "__main__":
    main()
