import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings
from pymongo import MongoClient

client = MongoClient(settings.MONGODB_URI)
db = client[settings.MONGODB_DB_NAME]

print("==================================================")
print("SECTION 8: ENTITY IMAGE DATA CHECK (5+ PER TYPE)")
print("==================================================")

# 1. PLACES (Inspect 5+ items)
places = list(db.places.find({}).limit(5))
print("\n--- PLACES (5 Sample Items) ---")
for p in places:
    img_url = p.get("image_url")
    status = "PRESENT" if img_url else "MISSING"
    print(f"ID: {p.get('place_id')} | Name: {p.get('name')} | MongoDB Image: {status} ({img_url})")

# 2. RESTAURANTS (Inspect 5+ items)
restaurants = list(db.restaurants.find({}).limit(5))
print("\n--- RESTAURANTS (5 Sample Items) ---")
for r in restaurants:
    img_url = r.get("image_url") or r.get("image")
    status = "PRESENT" if img_url else "MISSING"
    print(f"ID: {r.get('restaurant_id')} | Name: {r.get('restaurant_name')} | MongoDB Image: {status} ({img_url})")

# 3. ACTIVITIES (Inspect 5+ items)
activities = list(db.activities.find({}).limit(5))
print("\n--- ACTIVITIES (5 Sample Items) ---")
for a in activities:
    img_url = a.get("image_url") or a.get("image")
    status = "PRESENT" if img_url else "MISSING"
    print(f"ID: {a.get('activity_id')} | Name: {a.get('activity_name')} | MongoDB Image: {status} ({img_url})")

# 4. STAYS (Inspect 5+ items)
stays = list(db.stays.find({}).limit(5))
print("\n--- STAYS (5 Sample Items) ---")
for s in stays:
    img_url = s.get("image_url")
    status = "PRESENT" if img_url else "MISSING"
    print(f"ID: {s.get('stay_id')} | Name: {s.get('stay_name')} | MongoDB Image: {status} ({img_url})")

client.close()
