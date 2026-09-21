# SetuVia AI - Backend Service

SetuVia AI is an AI-powered travel concierge platform focused on Goa. This repository houses the FastAPI backend service responsible for dataset querying, rule-based recommendation scoring, Haversine geographic clustering, and structured LLM itinerary generation.

## Project Structure

```
setuvia-backend/
├── app/
│   ├── api/          # FastAPI routes & endpoints
│   ├── core/         # Settings & security configuration
│   ├── db/           # MongoDB Motor async driver connection
│   ├── engine/       # Rule-based filter, scoring, distance math
│   ├── models/       # Pydantic schemas for requests, responses & domain
│   ├── services/     # Recommendation & LLM service orchestrators
│   └── main.py       # FastAPI application entry point
├── tests/            # Pytest test suite
├── .env.example      # Environment variable template
├── .gitignore        # Git ignore rules
└── requirements.txt  # Python dependencies
```

## Quick Start

1. Create a Python virtual environment:
   ```bash
   python -m venv .venv
   ```
2. Activate the virtual environment:
   - Windows: `.venv\Scripts\activate`
   - Linux/macOS: `source .venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy environment file:
   ```bash
   cp .env.example .env
   ```
5. Run development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
