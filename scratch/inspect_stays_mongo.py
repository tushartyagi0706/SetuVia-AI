import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings
from pymongo import MongoClient

client = MongoClient(settings.MONGODB_URI)
db = client[settings.MONGODB_DB_NAME]
stays = list(db.stays.find({}))
print(f"Total stays: {len(stays)}")
for s in stays:
    print(f"ID: {s.get('stay_id')} | Name: {s.get('stay_name')} | image_url: {s.get('image_url')}")
client.close()
