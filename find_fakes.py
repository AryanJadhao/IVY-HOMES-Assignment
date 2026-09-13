import pandas as pd
import json

listings = pd.DataFrame(json.load(open('data/listings.json')))

# 1. Phone number inside description
has_phone = listings['description'].str.contains(r'\+91\d{10}', regex=True, na=False)
print("Listings with phone in description:", has_phone.sum())

# 2. Duplicate phone numbers for "owner"
owners = listings[listings['posted_by'] == 'owner']
owner_phone_counts = owners['posted_by_contact'].value_counts()
suspicious_phones = owner_phone_counts[owner_phone_counts > 1].index
fake_owners = owners[owners['posted_by_contact'].isin(suspicious_phones)]
print("Listings by owners with multiple properties:", len(fake_owners))

# 3. Very low prices
avg_prices = listings.groupby(['locality', 'bedroom'])['price'].transform('median')
cheap = listings[listings['price'] < 0.2 * avg_prices]
print("Suspiciously cheap listings:", len(cheap))

fake_ids = set()
fake_ids.update(listings[has_phone]['listing_id'].tolist())
fake_ids.update(fake_owners['listing_id'].tolist())
fake_ids.update(cheap['listing_id'].tolist())

print("\nTotal suspected fake IDs:", len(fake_ids))
print("Sample fake IDs:", sorted(list(fake_ids))[:10])

with open('data/fake_ids.json', 'w') as f:
    json.dump(sorted(list(fake_ids)), f)
