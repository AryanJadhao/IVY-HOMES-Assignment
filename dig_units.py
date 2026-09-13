import pandas as pd
import json

listings = pd.DataFrame(json.load(open('data/listings.json')))
magichomes = listings[listings['website'] == 'magichomes']
print("MagicHomes sample areas vs bhk:")
print(magichomes[['carpet_area', 'bedroom', 'price']].head(10))

rentals = pd.DataFrame(json.load(open('data/rentals.json')))
print("\nRentals sample prices (monthly or annual?):")
print(rentals[['price', 'bedroom', 'locality']].head(10))
