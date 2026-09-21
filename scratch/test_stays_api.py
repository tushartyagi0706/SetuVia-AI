import requests

print("==================================================")
print("SECTION 6: STAY API & IMAGE VERIFICATION")
print("==================================================")

res1 = requests.get("http://127.0.0.1:8000/api/v1/stays")
print(f"GET /api/v1/stays Status: {res1.status_code}")
if res1.status_code == 200:
    stays = res1.json()
    with_img = [s for s in stays if s.get("image_url")]
    print(f"Total stays returned: {len(stays)}")
    print(f"Stays with verified image_url: {len(with_img)}")
    for s in with_img:
        print(f"  - [{s.get('stay_id')}] {s.get('stay_name')} -> {s.get('image_url')}")

print("\n--- Testing Single Stay Endpoint ---")
stay_id = "GOA-STAY-003"
res2 = requests.get(f"http://127.0.0.1:8000/api/v1/stays/{stay_id}")
print(f"GET /api/v1/stays/{stay_id} Status: {res2.status_code}")
if res2.status_code == 200:
    stay = res2.json()
    print(f"Stay Name: {stay.get('stay_name')}")
    print(f"Verified image_url: {stay.get('image_url')}")
    print(f"Image Source: {stay.get('image_source')}")
