import sys
import io
import requests
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:8000"

print("--- 1. Testing GET /health ---")
r = requests.get(f"{BASE_URL}/health")
print("Health status:", r.status_code, r.json())
assert r.status_code == 200

print("\n--- 2. Testing GET /api/v1/stays ---")
r = requests.get(f"{BASE_URL}/api/v1/stays")
print("Stays status:", r.status_code, f"Count: {len(r.json())}")
assert r.status_code == 200 and len(r.json()) > 0
sample_stay = r.json()[0]
stay_id = sample_stay["stay_id"]
print(f"Sample Stay: {sample_stay['stay_name']} ({stay_id})")

print(f"\n--- 3. Testing GET /api/v1/stays/{stay_id}/evidence ---")
r = requests.get(f"{BASE_URL}/api/v1/stays/{stay_id}/evidence")
print("Evidence status:", r.status_code, json.dumps(r.json(), indent=2))
assert r.status_code == 200
assert "data_quality_flag" in r.json()

print("\n--- 4. Testing POST /api/v1/itinerary/generate ---")
gen_payload = {
    "destination": "Goa",
    "days": 3,
    "budget": 25000,
    "interests": ["Beaches", "Heritage"],
    "travel_pace": "Balanced",
    "food_preference": "Seafood",
    "selected_stay": {"stay_id": stay_id}
}
r = requests.post(f"{BASE_URL}/api/v1/itinerary/generate", json=gen_payload)
print("Generate status:", r.status_code)
assert r.status_code == 200
itinerary = r.json()
print("Generated headline:", itinerary.get("headline") or itinerary.get("narrative_summary"))
sample_slot = itinerary["days"][0]["slots"][0]
print("Sample Slot Explanation:", json.dumps(sample_slot.get("why_recommended"), indent=2))
assert "why_recommended" in sample_slot or "distance_from_stay_km" in sample_slot

print("\n--- 5. Testing POST /api/v1/itinerary/budget ---")
b_payload = {
    "current_itinerary": itinerary,
    "total_budget": 25000
}
r = requests.post(f"{BASE_URL}/api/v1/itinerary/budget", json=b_payload)
print("Budget status:", r.status_code, json.dumps(r.json(), indent=2))
assert r.status_code == 200
assert r.json()["breakdown"]["stay"] is None

print("\n--- 6. Testing POST /api/v1/itinerary/optimize-budget ---")
opt_payload = {
    "current_itinerary": itinerary,
    "selected_stay": sample_stay,
    "total_budget": 1000  # Intentionally low to trigger optimization
}
r = requests.post(f"{BASE_URL}/api/v1/itinerary/optimize-budget", json=opt_payload)
print("Optimize budget status:", r.status_code)
print("Changes made:", r.json()["changes_made"])
assert r.status_code == 200

print("\n--- 7. Testing POST /api/v1/itinerary/regenerate-day ---")
reg_payload = {
    "current_itinerary": itinerary,
    "day_number": 2,
    "selected_stay": sample_stay,
    "simulate_rain": True
}
r = requests.post(f"{BASE_URL}/api/v1/itinerary/regenerate-day", json=reg_payload)
print("Regenerate day status:", r.status_code)
assert r.status_code == 200
reg_res = r.json()
assert reg_res["regenerated_day"] == 2
assert reg_res["rain_adapted"] is True

print("\n--- 8. Testing POST /api/v1/chat (Ask Setu) ---")
chat_payload = {
    "message": "What places are near my stay?",
    "selected_stay": sample_stay,
    "itinerary": itinerary
}
r = requests.post(f"{BASE_URL}/api/v1/chat", json=chat_payload)
print("Chat status:", r.status_code, json.dumps(r.json(), indent=2))
assert r.status_code == 200
assert "reply" in r.json()

print("\nSUCCESS: ALL 8 LIVE BACKEND ENDPOINT TESTS PASSED CLEANLY!")
