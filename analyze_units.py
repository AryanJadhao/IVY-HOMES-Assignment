import pandas as pd
import json

def analyze_units():
    with open('data/listings.json', 'r') as f:
        listings = pd.DataFrame(json.load(f))
        
    print("Websites:", listings['website'].unique())
    for w in listings['website'].unique():
        sub = listings[listings['website'] == w]
        print(f"\nWebsite {w}:")
        print("Mean carpet area:", sub['carpet_area'].mean())
        print("Mean price:", sub['price'].mean())
        print("Price / Area:", (sub['price'] / sub['carpet_area']).mean())

    with open('data/projects.json', 'r') as f:
        projects = pd.DataFrame(json.load(f))
        
    print("\nProjects max price mean:", projects['price_max'].mean())
    print("Projects min price mean:", projects['price_min'].mean())

analyze_units()
