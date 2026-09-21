import os, sys, time
sys.path.insert(0, os.path.abspath("."))
from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

models_to_test = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

print("==================================================", flush=True)
print("FAST GEMINI BENCHMARK", flush=True)
print("==================================================", flush=True)

for m in models_to_test:
    start = time.time()
    try:
        res = client.models.generate_content(
            model=m,
            contents="Say hello in 3 words"
        )
        dur = time.time() - start
        print(f"Model: '{m}' -> SUCCESS in {dur:.2f}s | Response: {res.text.strip() if res else None}", flush=True)
    except Exception as e:
        dur = time.time() - start
        print(f"Model: '{m}' -> FAILED in {dur:.2f}s | Error: {e}", flush=True)
