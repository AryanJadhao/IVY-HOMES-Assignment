import pandas as pd
import json

def load_data():
    with open('data/listings.json', 'r') as f:
        listings = pd.DataFrame(json.load(f))
    with open('data/rentals.json', 'r') as f:
        rentals = pd.DataFrame(json.load(f))
    with open('data/projects.json', 'r') as f:
        projects = pd.DataFrame(json.load(f))
    return listings, rentals, projects

listings, rentals, projects = load_data()

print("==== LISTINGS SCHEMA ====")
print(listings.info())
print("\nSample Listings:")
print(listings[['listing_id', 'price', 'carpet_area', 'bedroom', 'is_live', 'is_verified', 'posted_by_contact']].head(3))

print("\n==== RENTALS SCHEMA ====")
print(rentals.info())
print("\nSample Rentals in Koramangala:")
k_rentals = rentals[rentals['locality'].str.lower() == 'koramangala']
print(k_rentals[['listing_id', 'price', 'deposit', 'carpet_area', 'bedroom']].head(3))

print("\n==== PROJECTS SCHEMA ====")
print(projects.info())
print("\nSample Projects:")
print(projects[['project_id', 'price_min', 'price_max', 'total_listings']].head(3))
