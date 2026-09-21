import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings
from pymongo import MongoClient

print("==================================================")
print("READ-ONLY MONGODB AUDIT")
print("==================================================")
print(f"Target Database Name: {settings.MONGODB_DB_NAME}")

client = MongoClient(settings.MONGODB_URI)
db = client[settings.MONGODB_DB_NAME]

# Collections: places, restaurants, activities, stays
places_docs = list(db.places.find({}))
rest_docs = list(db.restaurants.find({}))
act_docs = list(db.activities.find({}))
stays_docs = list(db.stays.find({}))

total_places = len(places_docs)
places_with_url = sum(1 for p in places_docs if p.get("image_url") and str(p.get("image_url")).strip())
places_with_src = sum(1 for p in places_docs if p.get("image_source") and str(p.get("image_source")).strip())

total_rest = len(rest_docs)
rest_with_image = sum(1 for r in rest_docs if (r.get("image_url") or r.get("image")) and str(r.get("image_url") or r.get("image")).strip())

total_act = len(act_docs)
act_with_image = sum(1 for a in act_docs if (a.get("image_url") or a.get("image")) and str(a.get("image_url") or a.get("image")).strip())

total_stays = len(stays_docs)
stays_with_url = sum(1 for s in stays_docs if s.get("image_url") and str(s.get("image_url")).strip())

print(f"\n--- COLLECTION STATS ---")
print(f"Places: Total = {total_places} | image_url present = {places_with_url} | image_source present = {places_with_src}")
print(f"Restaurants: Total = {total_rest} | image present = {rest_with_image}")
print(f"Activities: Total = {total_act} | image present = {act_with_image}")
print(f"Stays: Total = {total_stays} | image_url present = {stays_with_url}")

# Check 10 specific place IDs
target_ids = ["P010", "P062", "P073", "P082", "P083", "P093", "P107", "P109", "P111", "P112"]
places_by_id = {p.get("place_id"): p for p in places_docs if p.get("place_id")}

print(f"\n--- 10 SPECIFIC PLACES CHECK ---")
for pid in target_ids:
    p = places_by_id.get(pid)
    if not p:
        print(f"{pid}: NOT FOUND IN MONGODB")
    else:
        name = p.get("name", "Unknown")
        has_url = "PRESENT" if p.get("image_url") and str(p.get("image_url")).strip() else "MISSING"
        has_src = "PRESENT" if p.get("image_source") and str(p.get("image_source")).strip() else "MISSING"
        print(f"[{pid}] {name} -> image_url: {has_url} | image_source: {has_src}")

client.close()
