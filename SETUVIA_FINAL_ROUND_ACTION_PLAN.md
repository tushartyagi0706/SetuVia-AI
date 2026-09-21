# SETUVIA AI — FINAL ROUND ACTION PLAN & IMPLEMENTATION BLUEPRINT
## 92 → Final Round Push: 24-Hour / 48-Hour Technical Execution Plan

---

## 1. EXECUTIVE STRATEGY & SCORE MAXIMIZATION

- **Current Status**: Finalist (Score: 92/100)
- **Objective**: Execute high-impact, sponsor-aligned product enhancements (Trust Evidence Layer, Explainable AI Badges, Stay Anchor Map Visual, Transparent Trip Ledger, Budget Guardrails, and Day-Level Regeneration) to achieve maximum judge score and demonstration impact.
- **Core Principle**: Deliver concrete, empirical technical depth and flawless UX without over-promising or altering SetuVia’s core USP: *"Connecting WHERE YOU STAY with HOW YOU TRAVEL."*

---

## 2. TASK MATRIX & TEAM ROLE ALLOCATION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TEAM ROLE MATRIX                                 │
└─────────────────────────────────────────────────────────────────────────────┘
  • Lead Product Architect & AI Engineer: AI Grounding, Gemini 3.6 Flash,
    Day-Level Regeneration, Weather Swap Logic, Budget Optimizer API.
  • Frontend Engineering Lead: Trust Evidence Panel, Explainable Badges,
    Stay Anchor Leaflet Map, Transparent Ledger, Budget Guardrail UI.
  • Backend & Database Engineer: Endpoint specs, Pydantic schemas,
    Proximity scoring payload enrichment, Pytest verification.
  • UX & Demo Lead: 2.5-Minute Demo Flow, Judge Pitch Script, PPT Audit Alignment.
```

---

## 3. IMPLEMENTATION PRIORITY & FEATURE SPECS

### **P0 — MUST-HAVE IMPLEMENTATIONS (Immediate Execution)**

#### **Task 1: Trust Evidence Layer & Provenance Panel**
- **Files**: `frontend/src/components/StayDetailsModal.jsx`, `frontend/src/components/ItineraryCard.jsx`
- **Spec**: Render an inline provenance card exposing data source (`Goa Tourism GTDC`), last verification date (`2026-08-15`), data quality flag (`VERIFIED`), and direct official portal links.
- **Backend Schema**: Ensure `data_quality_flag`, `data_source`, `image_source`, `last_checked_at` are exposed in API responses.

#### **Task 2: Explainable AI Badges ("Why Recommended?")**
- **Files**: `frontend/src/components/ItineraryCard.jsx`, `app/models/responses.py`, `app/engine/itinerary.py`, `app/engine/llm.py`
- **Spec**: Compute and return `distance_from_stay_km` and `recommendation_reason` tags for every slot:
  - `📍 3.2 km from Vasco Residency (10 min drive)`
  - `🎯 Matches Beach interest`
  - `💰 Fits Balanced budget`

#### **Task 3: Stay Anchor Map Visualization**
- **Files**: `frontend/src/pages/ItineraryPage.jsx`
- **Spec**: Upgrade Leaflet map component to render the Selected Stay as a distinct golden Home/Hotel anchor pin with radiating daily route polylines connecting the stay to morning, lunch, and afternoon POI stops.

#### **Task 4: Transparent Trip Ledger & Budget Guardrail**
- **Files**: `frontend/src/components/TripSummary.jsx`, `frontend/src/components/BudgetInsights.jsx`
- **Spec**:
  - Add transparent ledger: `Stay Nightly Rate + Dining Estimate + Activity Fees + Transport = Total Estimated Trip Cost`.
  - Add Budget Guardrail bar (`Planned: ₹22,400 / Budget: ₹25,000`). If planned cost > budget, display a warning banner with a `"⚡ Auto-Optimize Budget"` action button.

---

### **P1 — HIGH-IMPACT FEATURES (24-Hour Execution)**

#### **Task 5: Day-Level Targeted AI Regeneration**
- **Files**: `frontend/src/components/DaySelector.jsx`, `app/api/v1/endpoints/itinerary.py`, `app/engine/modify_itinerary.py`
- **Spec**: Allow travelers to click `"Regenerate Day 2 Only"`. Backend modifies ONLY the specified day’s slots while preserving Days 1 and 3.

#### **Task 6: Adaptive Weather Planning & Activity Swap**
- **Files**: `frontend/src/pages/ItineraryPage.jsx`, `frontend/src/services/weatherService.js`, `app/engine/itinerary.py`
- **Spec**: Add a `"Simulate Rain"` weather toggle. When activated, the engine swaps outdoor beach activities with top-rated indoor attractions (e.g. Goa State Museum) and displays an explanatory alert.

---

## 4. 24-HOUR / 48-HOUR EXECUTION TIMELINE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       24-HOUR EXECUTION ROADMAP                             │
└─────────────────────────────────────────────────────────────────────────────┘
  [ Hours 00 - 04 ]: Backend Schema & Response Enrichment
                     • Expose distance_from_stay_km & recommendation_reason in
                       TimeSlotItem (responses.py).
                     • Update itinerary.py & llm.py post-processor.

  [ Hours 04 - 08 ]: Frontend Trust & Explainable AI UI
                     • Implement Provenance Badges in StayDetailsModal.jsx.
                     • Implement Explainable AI Tags in ItineraryCard.jsx.

  [ Hours 08 - 12 ]: Stay Anchor Map & Route Loops
                     • Upgrade Leaflet map in ItineraryPage.jsx with Golden Stay Pin.
                     • Add radiating daily loop polylines.

  [ Hours 12 - 16 ]: Transparent Trip Ledger & Budget Guardrail
                     • Add Itemized Ledger in TripSummary.jsx.
                     • Add Budget Guardrail & "Auto-Optimize Budget" button.

  [ Hours 16 - 20 ]: Day-Level AI Regeneration & Weather Swap
                     • Implement "Regenerate Day X Only" handler.
                     • Add "Simulate Rain" activity swap alert.

  [ Hours 20 - 24 ]: Full Verification & Demo Rehearsal
                     • Run pytest unit tests (23/23 PASSED).
                     • Run npm run build (0 errors).
                     • Rehearse 2.5-minute pitch script.
```

---

## 5. TECHNICAL ENDPOINT & API SPECIFICATIONS

### **1. Updated `TimeSlotItem` Response Schema**
```python
class TimeSlotItem(BaseModel):
    slot: str
    item_type: str
    item_id: str
    name: str
    category: str
    estimated_duration_hours: float = 1.0
    estimated_cost_inr: float = 0.0
    location_area: Optional[str] = None
    latitude: float
    longitude: float
    notes_or_tips: Optional[str] = None
    image_url: Optional[str] = None
    image_source: Optional[str] = None
    distance_from_stay_km: Optional[float] = None
    recommendation_reason: Optional[str] = None
    data_source: Optional[str] = None
```

### **2. Single-Day Regeneration Endpoint Spec**
- **URL**: `POST /api/v1/itinerary/regenerate-day`
- **Payload**:
  ```json
  {
    "day_number": 2,
    "current_itinerary": { ... },
    "user_instruction": "Replace beach with indoor cultural museum"
  }
  ```
- **Behavior**: Re-runs candidate scoring for Day 2 only and merges updated Day 2 slots into the existing `ItineraryResponse`.

---

## 6. VERIFICATION & TESTING PROTOCOL

1. **Backend Automated Tests**:
   ```bash
   pytest -v tests
   ```
   - Must achieve 100% pass rate (23/23 tests).

2. **Frontend Production Build**:
   ```bash
   cd frontend && npm run build
   ```
   - Must compile cleanly with 0 TypeScript/Vite errors.

3. **Live End-to-End API Test**:
   - Verify `POST /api/v1/itinerary/generate` with selected stay `GOA-STAY-003` returns valid JSON with `distance_from_stay_km` and trust metadata.

---

## 7. FINAL DEMO SCRIPT (2.5 MINUTES)

1. **[0:00 - 0:30] The Core Problem & Sponsor Alignment**:
   - *"Existing AI travel apps generate generic itineraries out of context. But where you stay defines how you travel. Inspired by Wayzyy's trust-first homestay model, SetuVia AI anchors your entire journey around your verified stay."*

2. **[0:30 - 1:00] Stay Discovery & Trust Evidence**:
   - Demonstrate `StayDiscoveryPage.jsx` -> Click `Vasco Residency` -> Show **Trust Evidence Panel** with verified GTDC data source and direct booking links.

3. **[1:00 - 1:45] Stay-Aware AI Generation & Map Hub**:
   - Select Vasco Residency -> Generate 3-Day Trip -> Show Itinerary cards with `📍 3.2km from Vasco Residency` badges -> Show Map view with Vasco Residency as the central golden hub pin.

4. **[1:45 - 2:15] Transparent Ledger & Day Regeneration**:
   - Open **Transparent Trip Ledger** (Stay + Dining + Activities + Transport) -> Click `"Regenerate Day 2 Only"` to show targeted AI adaptation.

5. **[2:15 - 2:30] Closing Value Prop**:
   - *"SetuVia AI: Connecting where you stay with how you travel — transparent, stay-aware, and 100% grounded."*

---

*NO CODE OR DATABASE MODIFICATIONS HAVE BEEN EXECUTED DURING THIS AUDIT.*
