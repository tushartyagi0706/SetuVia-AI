import os

brain_path = r"C:\Users\ASUS\.gemini\antigravity\brain"

print("==================================================")
print("READ-ONLY SEARCH ACROSS ALL GEMINI BRAIN LOGS & ARTIFACTS")
print("==================================================")

matches = []

for root, dirs, files in os.walk(brain_path):
    dirs[:] = [d for d in dirs if d.lower() not in ["node_modules", ".git"]]
    for f in files:
        if f.endswith(".jsonl") or f.endswith(".json") or f.endswith(".md") or f.endswith(".py") or f.endswith(".csv"):
            full_p = os.path.join(root, f)
            try:
                with open(full_p, "r", encoding="utf-8", errors="ignore") as fh:
                    content = fh.read()
                    if "P010" in content and "image_url" in content:
                        matches.append(full_p)
            except Exception:
                pass

print(f"Total matching files across brain trajectories/artifacts: {len(matches)}\n")
for m in matches:
    print(f"Found match: {m}")
