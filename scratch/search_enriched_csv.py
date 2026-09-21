import os
import sys

paths_to_check = [
    r"C:\Users\ASUS\OneDrive\Desktop",
    r"C:\Users\ASUS\Desktop",
    r"C:\Users\ASUS\Downloads",
    r"C:\Users\ASUS\Documents",
    r"C:\Users\ASUS\.gemini\antigravity\brain",
    r"C:\Users\ASUS\.gemini",
]

print("==================================================", flush=True)
print("READ-ONLY CSV SOURCE RECOVERY SEARCH", flush=True)
print("==================================================", flush=True)

found_csvs = []

for base_dir in paths_to_check:
    if not os.path.exists(base_dir):
        continue
    print(f"Scanning base dir: {base_dir}", flush=True)
    for root, dirs, files in os.walk(base_dir):
        # Prune heavy dirs
        dirs[:] = [d for d in dirs if d.lower() not in ["node_modules", ".git", "venv", "__pycache__", "dist", ".pytest_cache", "site-packages", "appdata"]]
        for f in files:
            if f.lower().endswith(".csv") or ("place" in f.lower() and "enrich" in f.lower()):
                full_p = os.path.join(root, f)
                found_csvs.append(full_p)
                print(f"FOUND CSV: {full_p}", flush=True)

print(f"\nTotal CSV files found: {len(found_csvs)}", flush=True)

import csv

for csv_path in found_csvs:
    print(f"\n==================================================", flush=True)
    print(f"INSPECTING: {csv_path}", flush=True)
    try:
        with open(csv_path, "r", encoding="utf-8", errors="ignore") as fh:
            reader = list(csv.DictReader(fh))
            total_rows = len(reader)
            headers = list(reader[0].keys()) if reader else []
            pids = set(r.get("place_id") or r.get("id") or "" for r in reader if (r.get("place_id") or r.get("id")))
            urls = [r for r in reader if (r.get("image_url") or r.get("image")) and str(r.get("image_url") or r.get("image")).strip()]
            srcs = [r for r in reader if r.get("image_source") and str(r.get("image_source")).strip()]
            
            print(f"Filename: {os.path.basename(csv_path)}", flush=True)
            print(f"Row count: {total_rows}", flush=True)
            print(f"Columns: {headers}", flush=True)
            print(f"Unique place_ids count: {len(pids)}", flush=True)
            print(f"Non-empty image_url count: {len(urls)}", flush=True)
            print(f"Non-empty image_source count: {len(srcs)}", flush=True)
            
            target_ids = ["P010", "P062", "P073", "P082", "P083", "P093", "P107", "P109", "P111", "P112"]
            by_pid = { (r.get("place_id") or r.get("id")): r for r in reader if (r.get("place_id") or r.get("id")) }
            
            print("\n10 Specific Place IDs Status in CSV:", flush=True)
            for t_id in target_ids:
                item = by_pid.get(t_id)
                if not item:
                    print(f"  [{t_id}]: NOT IN CSV", flush=True)
                else:
                    u = item.get("image_url") or item.get("image")
                    s = item.get("image_source")
                    print(f"  [{t_id}] {item.get('name')}: image_url={u} | image_source={s}", flush=True)
    except Exception as e:
        print(f"Error analyzing CSV: {e}", flush=True)
