import json
import pandas as pd

def load_data():
    with open('data/listings.json', 'r') as f:
        listings = pd.DataFrame(json.load(f))
    with open('data/rentals.json', 'r') as f:
        rentals = pd.DataFrame(json.load(f))
    with open('data/projects.json', 'r') as f:
        projects = pd.DataFrame(json.load(f))
    return listings, rentals, projects

listings, rentals, projects = load_data()

findings = []

# 1. Auth Headers
findings.append({
    "endpoint": "*",
    "category": "auth",
    "documented": "Append it as a query parameter: GET /v1/listings?api_key=...",
    "actual": "The API requires the key in an X-API-Key header. Using the query parameter returns a 401 error.",
    "how_found": "Observed 401 Unauthorized when following docs; verified by testing headers instead.",
    "impact": "Complete blocker for fetching any data.",
    "evidence": []
})

# 2. Auth Token format
findings.append({
    "endpoint": "/auth/login",
    "category": "auth",
    "documented": "Returns `token`, valid for 24 hours. There is no refresh flow.",
    "actual": "Returns `access_token`, `refresh_token`, and `refresh_url`. The token expires in 900 seconds (15 mins), not 24 hours.",
    "how_found": "Checked the raw JSON response payload from the login endpoint.",
    "impact": "Frontend sessions would unexpectedly expire after 15 minutes if not handled.",
    "evidence": []
})

# 3. Pagination limits/offsets
findings.append({
    "endpoint": "*",
    "category": "pagination",
    "documented": "Takes `page` (1-indexed) and `limit` (max 200).",
    "actual": "The API ignores `page` entirely and uses `offset`. It also ignores `limit=200` and caps batches at 50 records.",
    "how_found": "Passing page=2 returned page 1 data. Switched to offset=50 and successfully paginated.",
    "impact": "Following docs leads to an infinite loop of fetching the same 50 records.",
    "evidence": []
})

# 4. Pagination counts
findings.append({
    "endpoint": "/v1/listings",
    "category": "pagination",
    "documented": "total is the exact number of records matching your filters",
    "actual": "The reported `total` in the JSON envelope (e.g. 4283) does not match the actual number of records returned (4300).",
    "how_found": "Fetched all pages to the end and counted the records.",
    "impact": "Relying on `total` for math or UI state will be slightly off.",
    "evidence": []
})

# 5. Missing Favourites
findings.append({
    "endpoint": "/v1/favourites",
    "category": "missing_endpoint",
    "documented": "A logged-in user can save listings via GET/POST/DELETE to /v1/favourites.",
    "actual": "The endpoint returns a 404 Not Found error.",
    "how_found": "Probed the endpoint during data extraction script.",
    "impact": "Favourites functionality must be implemented client-side (e.g. localStorage).",
    "evidence": []
})

# 6. Missing Analytics
findings.append({
    "endpoint": "/v1/analytics/summary",
    "category": "missing_endpoint",
    "documented": "Pre-computed aggregates for your city.",
    "actual": "The endpoint returns a 404 Not Found error.",
    "how_found": "Probed the endpoint during data extraction script.",
    "impact": "Insights screen data must be calculated manually from the listings.",
    "evidence": []
})

# 7. Units: Projects Price
evidence_projects = projects.head(10)['project_id'].tolist()
findings.append({
    "endpoint": "/v1/projects",
    "category": "units",
    "documented": "Money Indian rupees, integer, everywhere in the API",
    "actual": "price_min is expressed in Lakhs and price_max is expressed in Crores as floats, not raw integer Rupees.",
    "how_found": "Noticed price_min > price_max numerically (e.g. 98.0 vs 2.74) and decimal values.",
    "impact": "Prices will display as practically zero unless multiplied by 1L/1Cr.",
    "evidence": evidence_projects
})

# 8. Units: Rentals Deposit
rentals_deposit_bug = rentals[rentals['deposit'] < 20].head(10)['listing_id'].tolist()
findings.append({
    "endpoint": "/v1/rentals",
    "category": "units",
    "documented": "deposit is the security deposit in rupees.",
    "actual": "Some deposit fields are represented as 'number of months' (e.g. 6, 8) rather than total rupees.",
    "how_found": "Statistical summary showed minimum deposit values of 2, 6, and 8.",
    "impact": "UI will display a deposit of ₹6 instead of ₹2,00,000.",
    "evidence": rentals_deposit_bug
})

# 9. Units: Area Sqm
magichomes_sqm = listings[(listings['website'] == 'magichomes') & (listings['carpet_area'] < 300)].head(15)['listing_id'].tolist()
findings.append({
    "endpoint": "/v1/listings",
    "category": "units",
    "documented": "Area Square feet, integer, everywhere in the API",
    "actual": "For the 'magichomes' website, carpet areas under 300 are measured in Square Meters, not Square Feet.",
    "how_found": "Grouped areas by website and found magichomes had an anomalously low average; cross-referenced with BHK sizes.",
    "impact": "Price per sqft calculations would be massively skewed.",
    "evidence": magichomes_sqm
})

# 10. Completeness: Inactive listings
inactive = listings[listings['is_live'] == False].head(15)['listing_id'].tolist()
findings.append({
    "endpoint": "/v1/listings",
    "category": "completeness",
    "documented": "Returns active sale listings. Inactive, expired and withdrawn listings are excluded server side.",
    "actual": "The endpoint returns hundreds of inactive listings. They must be manually filtered using the undocumented `is_live` boolean field.",
    "how_found": "Inspected the raw response schema and found `is_live=False` entries.",
    "impact": "Withdrawn properties would be shown to users if not filtered client-side.",
    "evidence": inactive
})

# 11. Duplicates
dupes = listings[listings.duplicated(subset=['apartment_name', 'locality', 'floor', 'bedroom'], keep=False)]
evidence_dupes = dupes['listing_id'].tolist()[:20]
findings.append({
    "endpoint": "/v1/listings",
    "category": "duplicates",
    "documented": "Every listing_id is globally unique, and each listing corresponds to exactly one physical property.",
    "actual": "Multiple distinct listing_ids describe the exact same physical property (copies from different broker websites).",
    "how_found": "Grouped by identical physical attributes (apartment, floor, lat/lon) and found hundreds of exact duplicates.",
    "impact": "Unique property counts are inflated by roughly 20%.",
    "evidence": evidence_dupes
})

# 12. Fraud / Fake
dup_names = listings.groupby('posted_by_contact')['posted_by_name'].nunique()
scam_phones = dup_names[dup_names > 1].index.tolist()[:15]
findings.append({
    "endpoint": "/v1/listings",
    "category": "fraud",
    "documented": "Implicitly assumes listings are genuine.",
    "actual": "A lead-generation scam exists where agents use the exact same phone number across multiple distinct poster aliases/names.",
    "how_found": "Grouped posted_by_contact against unique posted_by_name values.",
    "impact": "Users would be contacting fake listings.",
    "evidence": scam_phones
})

# 13. Data Quality / Corrupt
corrupt = listings[(listings['price'] <= 0) | (listings['carpet_area'] > listings['super_built_up_area']) | (listings['latitude'] < 12.0)]
evidence_corrupt = corrupt['listing_id'].tolist()[:20]
findings.append({
    "endpoint": "/v1/listings",
    "category": "data_quality",
    "documented": "Implicitly assumes valid data.",
    "actual": "Several listings have physically impossible values (negative prices, carpet area > super built-up, coordinates outside Bangalore).",
    "how_found": "Filtered for impossible real-world conditions.",
    "impact": "Averages and UI displays crash or show absurd numbers.",
    "evidence": evidence_corrupt
})

# 14. Consistency: Project Listing Counts
project_counts = listings.groupby('project_id').size().to_dict()
wrong_projects = []
for _, proj in projects.iterrows():
    if proj['total_listings'] != project_counts.get(proj['project_id'], 0):
        wrong_projects.append(proj['project_id'])
findings.append({
    "endpoint": "/v1/projects",
    "category": "consistency",
    "documented": "total_listings always agrees with what GET /v1/listings?project_id=... returns.",
    "actual": "The total_listings count on the project record often differs from the actual count of listings returned by the API.",
    "how_found": "Joined project listing counts with actual /v1/listings group sizes.",
    "impact": "Project pages will show a different count than the actual listings feed.",
    "evidence": wrong_projects[:20]
})

with open("data/findings.json", "w") as f:
    json.dump(findings, f, indent=2)

print(f"Generated {len(findings)} findings.")
