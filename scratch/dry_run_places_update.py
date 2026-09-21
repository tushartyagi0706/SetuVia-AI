import os
import sys
import csv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings
from pymongo import MongoClient

print("==================================================")
print("READ-ONLY DRY-RUN: PLACES IMAGE ENRICHMENT UPDATE")
print("==================================================")

csv_path = sys.argv[1] if len(sys.argv) > 1 else "places_enriched.csv"

if not os.path.exists(csv_path):
    print(f"NOTICE: CSV file '{csv_path}' not found at path.")
    print("Please place the validated CSV at 'places_enriched.csv' or provide the full file path.")
    sys.exit(0)

# 1. READ & VALIDATE CSV
with open(csv_path, "r", encoding="utf-8", errors="ignore") as fh:
    reader = list(csv.DictReader(fh))

csv_count = len(reader)
headers = list(reader[0].keys()) if reader else []
csv_pids = [r.get("place_id") for r in reader if r.get("place_id")]
unique_csv_pids = set(csv_pids)
duplicate_csv_pids = len(csv_pids) - len(unique_csv_pids)

print(f"CSV Path: {os.path.abspath(csv_path)}")
print(f"CSV Total Rows: {csv_count}")
print(f"CSV Headers: {headers}")
print(f"CSV Unique place_id Count: {len(unique_csv_pids)}")
print(f"CSV Duplicate IDs Count: {duplicate_csv_pids}")

# 2. READ LIVE MONGODB (READ ONLY)
client = MongoClient(settings.MONGODB_URI)
db = client[settings.MONGODB_DB_NAME]
mongo_places = list(db.places.find({}))
mongo_count = len(mongo_places)
mongo_by_pid = {p.get("place_id"): p for p in mongo_places if p.get("place_id")}

print(f"Live MongoDB places Collection Count: {mongo_count}")

# 3. COMPARE CSV vs MONGODB
missing_in_mongo = [pid for pid in unique_csv_pids if pid not in mongo_by_pid]
extra_in_csv = [pid for pid in unique_csv_pids if pid not in mongo_by_pid]
missing_in_csv = [pid for pid in mongo_by_pid if pid not in unique_csv_pids]

url_change_count = 0
source_change_count = 0
already_matching_count = 0

diff_records = []

for row in reader:
    pid = row.get("place_id")
    if not pid or pid not in mongo_by_pid:
        continue
    
    mongo_doc = mongo_by_pid[pid]
    csv_url = (row.get("image_url") or "").strip()
    csv_src = (row.get("image_source") or "").strip()
    
    current_url = (mongo_doc.get("image_url") or "").strip()
    current_src = (mongo_doc.get("image_source") or "").strip()
    
    url_will_change = csv_url != current_url
    
    # Handle P083, P093, P112 blank image_source safety check
    source_will_change = False
    if csv_src:
        source_will_change = csv_src != current_src
    elif not current_src and not csv_src:
        source_will_change = False
    else:
        # If current_src exists but csv_src is blank, do not overwrite unless intended
        source_will_change = False
        
    if url_will_change:
        url_change_count += 1
    if source_will_change:
        source_change_count += 1
    if not url_will_change and not source_will_change:
        already_matching_count += 1
        
    if url_will_change or source_will_change:
        diff_records.append({
            "place_id": pid,
            "name": row.get("name"),
            "url_change": f"'{current_url}' -> '{csv_url}'",
            "source_change": f"'{current_src}' -> '{csv_src}'"
        })

print("\n==================================================")
print("DRY-RUN COMPARISON REPORT")
print("==================================================")
print(f"CSV Total Records: {csv_count}")
print(f"MongoDB Total Records: {mongo_count}")
print(f"Unique place_ids Matched: {len(unique_csv_pids)}")
print(f"Duplicate IDs: {duplicate_csv_pids}")
print(f"Missing MongoDB IDs: {len(missing_in_mongo)}")
print(f"Extra CSV IDs: {len(extra_in_csv)}")

print(f"\nRecords Needing image_url Update: {url_change_count}")
print(f"Records Needing image_source Update: {source_change_count}")
print(f"Already Matching Records: {already_matching_count}")

print("\nSafety Confirmation:")
print("Only image_url and image_source would be modified using $set operations.")
print("NO DATABASE CHANGES HAVE BEEN MADE.")

client.close()
