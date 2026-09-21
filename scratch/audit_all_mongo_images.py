import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from pymongo import MongoClient

mongo_uri = settings.MONGODB_URI
db_name = settings.MONGODB_DB_NAME

print(f"Connecting to MongoDB URI: {mongo_uri[:25]}... DB: {db_name}")

client = MongoClient(mongo_uri)
db = client[db_name]

collections = ["places", "restaurants", "activities", "stays"]

print("==================================================")
print("1. MONGODB IMAGE DATA AUDIT")
print("==================================================")

for coll_name in collections:
    coll = db[coll_name]
    docs = list(coll.find({}))
    total = len(docs)
    
    sample_fields = set()
    image_field_keys = set()
    
    with_image_url = 0
    with_image_source = 0
    with_image_field = 0
    with_any_image_field = 0

    for doc in docs:
        for k in doc.keys():
            sample_fields.add(k)
            if any(term in k.lower() for term in ["image", "photo", "img", "picture", "media", "src"]):
                image_field_keys.add(k)
        
        has_url = bool(doc.get("image_url") and str(doc.get("image_url")).strip())
        has_source = bool(doc.get("image_source") and str(doc.get("image_source")).strip())
        has_img = bool(doc.get("image") and str(doc.get("image")).strip())
        
        if has_url:
            with_image_url += 1
        if has_source:
            with_image_source += 1
        if has_img:
            with_image_field += 1
        
        any_img = False
        for k, v in doc.items():
            if any(term in k.lower() for term in ["image", "photo", "img", "picture"]) and v and str(v).strip():
                any_img = True
                break
        if any_img:
            with_any_image_field += 1

    print(f"\n--- COLLECTION: {coll_name} ---")
    print(f"Total documents: {total}")
    print(f"Image-related keys present: {sorted(list(image_field_keys))}")
    print(f"All schema fields present: {sorted(list(sample_fields))}")
    print(f"Documents with 'image_url': {with_image_url}")
    print(f"Documents with 'image_source': {with_image_source}")
    print(f"Documents with 'image': {with_image_field}")
    print(f"Documents with ANY verified image field: {with_any_image_field}")
    print(f"Documents WITHOUT image: {total - with_any_image_field}")

client.close()
