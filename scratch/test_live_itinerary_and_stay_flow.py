import requests
import json

url = "http://127.0.0.1:8000/api/v1/itinerary/generate"
payload = {
    "destination": "Goa",
    "days": 3,
    "budget": 25000,
    "interests": ["Beaches", "Food", "Nature"],
    "travel_pace": "Balanced",
    "food_preference": "Any",
    "selected_stay": {
        "stay_id": "GOA-STAY-003"
    }
}

print("==================================================")
print("SECTION 9 & 10: LIVE ITINERARY GENERATION TEST")
print("==================================================")

try:
    res = requests.post(url, json=payload, timeout=60)
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"Destination: {data.get('destination')}")
        print(f"Total Days: {data.get('total_days')}")
        print(f"Narrative Summary: {data.get('narrative_summary')}")
        
        verified_count = 0
        fallback_count = 0
        missing_count = 0
        
        days = data.get("days", [])
        print(f"\nTotal Days Returned: {len(days)}")
        for d in days:
            print(f"\n--- Day {d.get('day')}: {d.get('title')} ---")
            for slot in d.get("slots", []):
                name = slot.get("name")
                slot_name = slot.get("slot")
                type_ = slot.get("item_type")
                img_url = slot.get("image_url")
                if img_url:
                    verified_count += 1
                    status = f"REAL VERIFIED IMAGE ({img_url})"
                else:
                    fallback_count += 1
                    status = "GENERIC FALLBACK ASSIGNED BY FRONTEND (No MongoDB image)"
                print(f"  [{slot_name}] ({type_}) {name} -> {status}")
                
        print("\n--------------------------------------------------")
        print(f"Verified MongoDB/Backend Images: {verified_count}")
        print(f"Generic Fallback Images: {fallback_count}")
        print(f"Missing/Broken Images: {missing_count}")
        print("--------------------------------------------------")
    else:
        print("Error Response:", res.text)
except Exception as e:
    print(f"Request failed: {e}")
