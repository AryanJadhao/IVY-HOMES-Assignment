import pandas as pd
import json
from datetime import datetime

def solve():
    with open('data/listings.json', 'r') as f:
        listings = pd.DataFrame(json.load(f))
    with open('data/rentals.json', 'r') as f:
        rentals = pd.DataFrame(json.load(f))
    with open('data/projects.json', 'r') as f:
        projects = pd.DataFrame(json.load(f))
        
    ans = {}
    
    # 1. total_listing_records
    ans['total_listing_records'] = len(listings)
    
    # Pre-process: fix unit bug in magichomes area (if < 300 it's in sq meters)
    def fix_area(row):
        if row['website'] == 'magichomes' and row['carpet_area'] < 300:
            return row['carpet_area'] * 10.76391
        return float(row['carpet_area'])
    
    listings['carpet_area_sqft'] = listings.apply(fix_area, axis=1)
    
    # 2. unique_properties
    ans['unique_properties'] = listings.drop_duplicates(subset=['apartment_name', 'locality', 'floor', 'bedroom', 'facing_direction']).shape[0]
    
    # 3. active_listings
    ans['active_listings'] = int(listings['is_live'].sum())
    
    # 4. corrupt_listing_ids
    corrupt = listings[
        (listings['carpet_area'] <= 0) |
        (listings['super_built_up_area'] <= 0) |
        (listings['carpet_area'] > listings['super_built_up_area']) |
        (listings['bedroom'] <= 0) |
        (listings['bathroom'] <= 0) |
        (listings['floor'] > listings['total_floors']) |
        (listings['price'] <= 0) |
        (listings['latitude'] < 12.0) | (listings['latitude'] > 14.0) |
        (listings['longitude'] < 77.0) | (listings['longitude'] > 78.0)
    ]
    ans['corrupt_listing_ids'] = sorted(corrupt['listing_id'].tolist())
    
    # 9. fake_listing_ids
    dup_names = listings.groupby('posted_by_contact')['posted_by_name'].nunique()
    scam_phones = dup_names[dup_names > 1].index
    fakes = listings[listings['posted_by_contact'].isin(scam_phones)]
    ans['fake_listing_ids'] = sorted(fakes['listing_id'].tolist())
    
    # 5. total_monthly_rent
    k_rentals = rentals[rentals['locality'].str.lower() == 'koramangala']
    ans['total_monthly_rent'] = int(k_rentals['price'].sum())
    
    # 6. avg_price_per_sqft_2bhk
    valid = listings[
        (listings['is_live'] == True) & 
        (listings['bedroom'] == 2) &
        (~listings['listing_id'].isin(ans['corrupt_listing_ids'])) &
        (~listings['listing_id'].isin(ans['fake_listing_ids']))
    ]
    mean_val = (valid['price'] / valid['carpet_area_sqft']).mean()
    ans['avg_price_per_sqft_2bhk'] = round(mean_val, 2)
    
    # 7. costliest_project
    costliest = projects.loc[projects['price_max'].idxmax()]
    ans['costliest_project'] = {
        "project_id": costliest['project_id'],
        "price_max_inr": int(costliest['price_max'] * 10000000)
    }
    
    # 8. listings_last_7_days
    ref_time = datetime.fromisoformat('2026-09-10T00:00:00+05:30')
    def is_in_window(ts_str):
        ts = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
        diff = (ref_time - ts).total_seconds()
        return 0 < diff <= 7 * 24 * 3600
        
    ans['listings_last_7_days'] = int(listings['posted_at'].apply(is_in_window).sum())
    
    # 10. projects_with_wrong_listing_count
    project_counts = listings.groupby('project_id').size().to_dict()
    wrong_count = 0
    for _, proj in projects.iterrows():
        actual = project_counts.get(proj['project_id'], 0)
        if proj['total_listings'] != actual:
            wrong_count += 1
            
    ans['projects_with_wrong_listing_count'] = wrong_count
    
    with open('submission_answers.json', 'w') as f:
        json.dump({"answers": ans}, f, indent=2)
        
    print("Answers saved to submission_answers.json!")
    
solve()
