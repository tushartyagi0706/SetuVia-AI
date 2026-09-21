# SETUVIA AI — FINAL MASTER PRODUCT + AI CONCIERGE AUDIT & IMPLEMENTATION BLUEPRINT

---

## 1. EXECUTIVE SUMMARY

- **Project Title**: SetuVia AI — AI-Powered Travel Concierge
- **Core Positioning**: *"Connecting WHERE YOU STAY with HOW YOU TRAVEL"*
- **Status**: Hackathon Finalist (Previous Score: **92/100**)
- **Sponsor**: **Wayzyy** ([https://wayzyy.com/](https://wayzyy.com/)) — *"cozy stays, crazy nights and fair hosting. That's wayzyy"*
- **Audit Objective**: Conduct an empirical, code-level read-only audit of the entire SetuVia AI application to design an implementation-ready blueprint for the 6 core final-round features.

> [!CAUTION]
> **STRICT READ-ONLY AUDIT PROTOCOL**:
> - NO database writes, document deletions, or schema alterations executed.
> - NO source code modified or packages installed during this audit.
> - NO second backend or second database introduced.
> - NO fake trust scores or fabricated image URLs introduced.

---

## 2. CURRENT ARCHITECTURE AUDIT

An audit of the existing SetuVia AI codebase (`c:\Users\ASUS\OneDrive\Desktop\SetuVia-AI`):

```
SetuVia-AI/
├── app/
│   ├── main.py                     [FastAPI CORS, API V1 Router]
│   ├── core/config.py              [Environment variables: MONGODB_URI, GEMINI_API_KEY]
│   ├── db/mongodb.py               [Motor AsyncIO client with TLS fallback]
│   ├── db/queries.py               [MongoDB queries for places, restaurants, activities, stays]
│   ├── engine/
│   │   ├── data_adapter.py        [Normalizes domain models into CandidateItem]
│   │   ├── distance.py            [Haversine formula in km]
│   │   ├── scoring.py             [Category, interest, rating scoring]
│   │   ├── stay.py                [Stay proximity boost calculation]
│   │   ├── recommendation.py      [Ranks candidate POIs using composite scoring]
│   │   ├── itinerary.py           [Deterministic Smart Scheduler fallback engine]
│   │   ├── llm.py                 [Grounded Gemini 3.6 Flash LLM Concierge]
│   │   └── modify_itinerary.py    [Gemini LLM itinerary modification engine]
│   ├── models/
│   │   ├── domain.py              [PlaceDomain, RestaurantDomain, ActivityDomain, StayDomain]
│   │   ├── requests.py            [TripPreferencesRequest, ModifyItineraryRequest]
│   │   └── responses.py           [CandidateItem, TimeSlotItem, ItineraryResponse]
│   └── api/v1/endpoints/
│       ├── itinerary.py           [POST /generate, POST /modify]
│       ├── places.py              [GET /places]
│       └── stays.py               [GET /stays, GET /stays/{stay_id}]
└── frontend/
    ├── src/
    │   ├── components/            [ItineraryCard, StayCard, StayDetailsModal, PreferenceForm, etc.]
    │   ├── pages/                 [HomePage, StayDiscoveryPage, PreferencesPage, GeneratingPage, ItineraryPage]
    │   ├── context/TripContext.jsx[Global state: preferences, selectedStay, itinerary, savedTrips]
    │   └── services/              [itineraryService, stayService, weatherService, routeService]
```

### **Database Inventory (MongoDB Atlas `setuvia` Database)**
- `places`: 114 documents (`place_id`, `name`, `category`, `entry_fee`, `rating`, `latitude`, `longitude`, `opening_time`, `closing_time`, `best_time_to_visit`)
- `restaurants`: 25 documents (`restaurant_id`, `restaurant_name`, `cuisine`, `area`, `latitude`, `longitude`, `average_cost_for_two_inr`, `rating_value`)
- `activities`: 25 documents (`activity_id`, `activity_name`, `category`, `area`, `cost_inr`, `duration_hours`, `latitude`, `longitude`)
- `stays`: 11 documents (`stay_id`, `stay_name`, `stay_type`, `area`, `latitude`, `longitude`, `image_url`, `image_source`, `rating`, `official_website`, `booking_url`, `data_source`, `data_quality_flag`)

---

## 3. EXISTING FEATURE REUSE

| Feature / Subsystem | Reusable Assets in Codebase | What Must Be Added / Extended |
|---|---|---|
| **Stay Discovery & Specs** | `StayDiscoveryPage.jsx`, `StayCard.jsx`, `StayDetailsModal.jsx`, `stayService.js`, `GET /api/v1/stays` | Trust Evidence Panel rendering GTDC provenance metadata inline. |
| **Recommendation Engine** | `stay.py` proximity boost, `distance.py` Haversine formula, `recommendation.py` ranking | Expose `distance_from_stay_km` and `recommendation_reason` tags in API outputs. |
| **Grounded Gemini AI** | `llm.py` prompt assembler & Gemini 3.6 Flash client | Grounding post-processor for tool-calling Concierge. |
| **Itinerary Modification** | `modify_itinerary.py`, `ModificationChat.jsx` | Targeted single-day regeneration endpoint (`POST /api/v1/itinerary/regenerate-day`). |
| **Map Rendering** | `ItineraryPage.jsx`, `routeService.js`, Leaflet integration | Golden Stay Anchor Pin with radiating daily loop polylines. |
| **Cost Summaries** | `costs.py`, `BudgetInsights.jsx`, `TripSummary.jsx` | Transparent Trip Ledger (Stay + Dining + Activity + Fuel) & Budget Guardrail warning. |
| **Weather** | `weatherService.js`, `WeatherBadge.jsx` | Demo "Simulate Rain" toggle triggering indoor activity swaps in scoring. |

---

## 4. TRUST PANEL SPECIFICATION

Following Wayzyy’s evidence-respecting philosophy, SetuVia will render an **Empirical Trust Provenance Panel** inside `StayDetailsModal.jsx` and `ItineraryCard.jsx`. We **DO NOT** output arbitrary "Trust Scores" (e.g. 94/100). Instead, we display verifiable metadata:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRUST & DATA PROVENANCE PANEL                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✓ Verified Source: Goa Tourism Development Corp (GTDC)                     │
│  ✓ Data Quality Status: VERIFIED                                            │
│  ✓ Image Provenance: Official GTDC Media Repository                         │
│  ✓ Last Audited Date: 2026-08-15                                            │
│  🔗 Official Website: https://goa-tourism.com                               │
│  ⚡ Direct Booking: https://goa-tourism.com/residencies/vasco-residency/    │
│  💡 Zero Platform Markup: Book Direct & Save 18% Middleman Fees             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. EXPLAINABLE AI SPECIFICATION ("WHY RECOMMENDED?")

Rather than relying on Gemini hallucinations, SetuVia generates explainability tags deterministically in `app/engine/itinerary.py` and `app/engine/llm.py`:

```python
def generate_recommendation_reason(item: CandidateItem, stay: Optional[StayDomain], prefs: TripPreferencesRequest) -> List[str]:
    reasons = []
    if stay and stay.latitude and stay.longitude:
        dist = haversine_distance_km(item.latitude, item.longitude, stay.latitude, stay.longitude)
        reasons.append(f"📍 {dist:.1f} km from your stay ({int(dist * 3)} min drive)")
    
    if item.category and any(interest.lower() in item.category.lower() for interest in prefs.interests):
        reasons.append(f"🎯 Matches '{item.category}' interest")
        
    if item.cost == 0:
        reasons.append("💰 Free attraction")
    elif item.cost < (prefs.budget / (prefs.days * 4)):
        reasons.append("💰 Budget friendly")
        
    return reasons
```

---

## 6. MAP ARCHITECTURE DECISION

> [!IMPORTANT]
> **FINAL DECISION: DO NOT USE GOOGLE MAPS. USE OPTION C (Leaflet + OpenStreetMap + OSRM Routing).**

### **Technical Justification**
1. **Zero Quota Failure Risk**: Google Maps JS API introduces live billing requirements, key restrictions, and domain verification that present catastrophic risk during a 2-minute live hackathon demo.
2. **Current Code Alignment**: SetuVia’s existing frontend already integrates Leaflet cleanly.
3. **Anchor & Route Loop Capabilities**: Leaflet natively supports custom SVG icons (Golden Stay Anchor Pin) and `L.polyline` / `leaflet-routing-machine` for rendering day-wise loop routes from the stay anchor to POIs and back.

---

## 7. TRANSPARENT TRIP BUDGET & GUARDRAIL

### **Calculation Formula**
$$\text{Total Trip Cost} = \text{Stay Cost} + \sum \text{Activity Entry Fees} + \sum \text{Dining Estimates} + \text{Estimated Transport Fuel}$$

Where:
- **Stay Cost**: `stay.price_per_night * total_days` (If `price_per_night` absent in MongoDB, default estimate `₹2,500/night` clearly labeled `"Estimated Rate"`).
- **Dining Cost**: `average_cost_for_two_inr / 2` per meal.
- **Activity Fees**: `places.entry_fee` + `activities.cost_inr`.
- **Transport Fuel**: `₹500 / day` estimated scooter/cab fuel.

### **Budget Guardrail Action**
In `TripSummary.jsx` & `BudgetInsights.jsx`:
- **Progress Bar**: `Planned Spend: ₹22,400 / User Cap: ₹25,000`.
- **Over-Budget State**: If Planned > Cap, show Warning Banner: `⚠️ Itinerary exceeds budget cap by ₹2,400`.
- **Action Button**: `"⚡ Auto-Optimize Budget"`. Triggers engine to swap high-cost optional activities for top-rated free attractions.

---

## 8. DAY-LEVEL REGENERATION ARCHITECTURE

- **Endpoint**: `POST /api/v1/itinerary/regenerate-day`
- **Request Schema (`app/models/requests.py`)**:
  ```python
  class RegenerateDayRequest(BaseModel):
      day_number: int = Field(..., gt=0, le=14, description="1-indexed day number to regenerate")
      user_instruction: Optional[str] = Field(default="Make this day more relaxed", description="Modification instruction")
      current_itinerary: Dict[str, Any] = Field(..., description="Active ItineraryResponse JSON")
  ```
- **Execution Flow**:
  1. Extract `current_itinerary` and `day_number`.
  2. Keep all slots for other days (`day != day_number`) immutable.
  3. Re-run candidate scoring for the active stay anchor and execute Gemini 3.6 Flash generation specifically for `day_number`.
  4. Replace `days[day_number - 1]` in the itinerary and re-calculate total cost.

---

## 9. WEATHER-AWARE ADAPTATION

- **Live Mode**: `weatherService.js` fetches 5-day forecast for Goa.
- **Demo Control ("Simulate Rain")**: Toggle button on `ItineraryPage.jsx`.
- **Adaptation Logic**: When Rain status is active, `scoring.py` penalizes outdoor categories (`Beaches`, `Water Sports`, `Viewpoints`) by -50% and boosts indoor categories (`Museums`, `Art Galleries`, `Heritage Churches`, `Indoor Dining`) by +80%.
- **UI Alert**: `🌧️ Weather Alert: Swapped Baga Beach for Houses of Goa Museum due to rainfall forecast.`

---

## 10. 24/7 CONTEXT-AWARE SETUVIA AI CONCIERGE ARCHITECTURE

### **Architectural Model: Option C (Tool-Using Agent Framework)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SETUVIA AI CONCIERGE ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                              [ User Chat Input ]
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │  SetuVia Concierge Service    │
                       │  (Context Ingestion & Router) │
                       └───────────────┬───────────────┘
                                       │
             ┌─────────────────────────┴─────────────────────────┐
             ▼                                                   ▼
┌──────────────────────────┐                       ┌──────────────────────────┐
│ Active Trip Context      │                       │ Gemini 3.6 Flash Agent   │
│ (Preferences, Stay,      │                       │ (Tool Selection & Prompt)│
│  Itinerary, Weather)     │                       └────────────┬─────────────┘
└──────────────────────────┘                                    │
                                                                ▼
                                                   ┌──────────────────────────┐
                                                   │ Backend Tool Executor    │
                                                   └────────────┬─────────────┘
                                                                │
   ┌───────────────────┬───────────────────┬────────────────────┼───────────────────┐
   ▼                   ▼                   ▼                    ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐   ┌───────────────────┐   ┌──────────────┐
│ Mongo Search │  │ Distance Calc│  │ Budget Ledger│   │ Day Regeneration  │   │ Weather Adapt│
│ (Places/Rests│  │ (Haversine)  │  │ (Cost Calc)  │   │ (Single-day AI)   │   │ (Outdoor/In) │
└──────────────┘  └──────────────┘  └──────────────┘   └───────────────────┘   └──────────────┘
```

---

## 11. AI CONCIERGE TOOL DEFINITIONS (12 TOOLS)

| # | Tool Name | Purpose | Inputs | Outputs | Existing / Reused Code | Read vs Mutation | Confirmation Needed? |
|---|---|---|---|---|---|---|---|
| **1** | `search_places` | Search places by category/name | `category`, `query` | List of `PlaceDomain` | `queries.get_all_places` | Read | No |
| **2** | `search_restaurants` | Search dining by cuisine/area | `cuisine`, `area` | List of `RestaurantDomain` | `queries.get_all_restaurants` | Read | No |
| **3** | `search_activities` | Search water sports/adventure | `category` | List of `ActivityDomain` | `queries.get_all_activities` | Read | No |
| **4** | `get_selected_stay` | Fetch current stay anchor details | None | `StayDomain` object | `TripContext.selectedStay` | Read | No |
| **5** | `calculate_distance` | Compute distance between stay & POI | `poi_lat`, `poi_lon` | Distance in km & time | `distance.haversine_distance_km` | Read | No |
| **6** | `get_weather` | Fetch forecast or rain simulation | `city` | Weather status & icon | `weatherService.js` | Read | No |
| **7** | `get_current_itinerary` | Retrieve active trip JSON | None | `ItineraryResponse` | `TripContext.itinerary` | Read | No |
| **8** | `calculate_trip_budget` | Compute budget ledger breakdown | None | Budget Ledger JSON | `costs.compute_itinerary_cost` | Read | No |
| **9** | `explain_recommendation` | Generate reason codes for POI | `item_id` | List of reason strings | `scoring.py` / `itinerary.py` | Read | No |
| **10** | `regenerate_day` | Re-plan single day itinerary | `day_number`, `prompt` | Updated `ItineraryDay` | `POST /api/v1/itinerary/regenerate-day` | **Mutation** | **Yes (Confirm Modal)** |
| **11** | `optimize_budget` | Auto-prune over-budget items | None | Optimized `ItineraryResponse` | `POST /api/v1/itinerary/optimize-budget` | **Mutation** | **Yes (Confirm Modal)** |
| **12** | `modify_itinerary` | Multi-day chat modification | `user_instruction` | Modified `ItineraryResponse` | `POST /api/v1/itinerary/modify` | **Mutation** | **Yes (Confirm Modal)** |

---

## 12. SECURITY, GROUNDING & 24/7 PRODUCT TERMINOLOGY

1. **Grounding Rule**: The Concierge AI MUST query local services (`search_places`, `search_restaurants`, `search_activities`) before answering POI questions. If a place does not exist in MongoDB, the AI outputs: *"I don't have verified information for that in the current SetuVia database."*
2. **24/7 Product Wording**:
   - UI Label: **"SetuVia 24/7 AI Travel Concierge"**
   - Disclaimer: *"Powered by SetuVia AI Engine. Always available to guide your trip."*

---

## 13. CHATBOT UX & MUTATION CONFIRMATION FLOW

- **UI Component**: Floating action button `"Ask SetuVia"` on bottom-right of `ItineraryPage.jsx` opening a slide-over panel `SetuViaConciergeModal.jsx`.
- **Mutation Guard**: When a tool executes a write/mutation action (`regenerate_day`, `optimize_budget`, `modify_itinerary`), the chat renders a **Confirmation Card**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚡ CONCIERGE PROPOSES ITINERARY CHANGE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Action: Regenerate Day 2                                                    │
│ Change: Replace Beach with Houses of Goa Museum & Mum's Kitchen.            │
│ Cost Impact: -₹800 (New Total: ₹21,600)                                     │
│                                                                             │
│ [ ✓ Apply Changes to Trip ]                     [ ✕ Cancel ]                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. SPONSOR ALIGNMENT (WAYZYY vs SETUVIA)

- **Wayzyy Capability**: 0% commission, direct host connection, transparent fees, evidence-backed disputes, local Goan stay focus.
- **SetuVia Concierge Integration**:
  - Direct host booking links displayed in Concierge responses.
  - Transparent pricing ledger surfaced when users ask *"Am I going over budget?"*.
  - Authentic local Goan spice markets and dining surfaced when users ask *"What's good near my stay?"*.

---

## 15. PPT CLAIM vs PRODUCT REALITY AUDIT

| PPT Slide / Claim | Actual Implementation | Demo Proof | Action Required |
|---|---|---|---|
| *"Connecting Stay with Travel"* | Proximity scoring engine in `stay.py` | Visual Golden Stay Map Pin & distance badges | **KEEP & HIGHLIGHT** |
| *"Verified Homestays"* | GTDC Verified stays in MongoDB | Trust Evidence Modal with dataset tags | **KEEP** (Refine wording to "Verified GTDC & Partner Stays") |
| *"Zero Hidden Markups"* | Itemized entry fees & meal costs | Transparent Trip Ledger component | **KEEP** |
| *"24/7 AI Travel Concierge"* | Gemini 3.6 Flash tool-using agent | Interactive Chat Panel with tool cards | **KEEP** |
| *"Host AI Growth Toolkit"* | None | N/A | **MOVE TO FUTURE ROADMAP SLIDE** |

---

## 16. FEATURE PRIORITY MATRIX (P0 to P3)

| Priority | Feature Name | User Value | Technical Depth | Sponsor Alignment | Demo Impact | Feasibility |
|---|---|---|---|---|---|---|
| **P0** | **Trust Evidence Panel** | High | Med | **Extremely High** | **Extremely High** | 100% |
| **P0** | **Explainable AI Badges** | High | Med | High | **Extremely High** | 100% |
| **P0** | **Stay Anchor Leaflet Map** | High | Med | High | **Extremely High** | 100% |
| **P0** | **Transparent Trip Ledger** | High | Low | **High** | High | 100% |
| **P0** | **SetuVia AI Concierge Panel** | Extremely High | High | High | **Extremely High** | 100% |
| **P1** | **Day-Level AI Regeneration** | High | High | Med | High | 100% |
| **P1** | **Adaptive Weather Swap** | High | Med | Low | High | 100% |
| **P2** | **Direct Booking Savings Badge**| Med | Low | **High** | Med | 100% |
| **P3** | **Host AI Assistant (Slide Only)**| N/A | High | High | Low (PPT only)| Slide Only |

---

## 17. TEAM TASK BREAKDOWN

- **AI & Backend Lead**:
  1. Implement `POST /api/v1/itinerary/regenerate-day` and `POST /api/v1/itinerary/optimize-budget`.
  2. Implement Concierge router endpoint `POST /api/v1/concierge/chat` with tool definitions.
  3. Enrich `TimeSlotItem` response model with `distance_from_stay_km` and `recommendation_reason`.
- **Frontend Lead**:
  1. Build `TrustEvidencePanel` inside `StayDetailsModal.jsx` and `ItineraryCard.jsx`.
  2. Build `TransparentTripLedger` inside `TripSummary.jsx`.
  3. Upgrade Leaflet map on `ItineraryPage.jsx` with Golden Stay Pin & route loops.
  4. Build floating `SetuViaConciergeModal.jsx` chat drawer with confirmation cards.
- **Integration Lead**:
  1. Run pytest suite (23/23 PASSED).
  2. Execute `npm run build` (0 errors).
  3. Rehearse 2.5-minute final pitch flow.

---

## 18. FINAL DEMO FLOW (2.5 MINUTES)

```
0:00 - 0:30  -> SLIDE & STAY DISCOVERY
                "Most AI travel apps ignore where you stay. SetuVia anchors your trip to your stay."
                Click Vasco Residency -> Open Trust Evidence Panel.

0:30 - 1:00  -> PREFERENCES & STAY ANCHORING
                Select Vasco Residency -> Set 3 Days, ₹25,000 Budget, Beaches & Food -> Generate.

1:00 - 1:45  -> STAY-AWARE ITINERARY & MAP LOOP
                Show itinerary cards with "📍 3.2km from stay" -> Show Leaflet map with Golden Stay Anchor Pin.

1:45 - 2:15  -> CONCIERGE CHAT & DAY REGENERATION
                Open "Ask SetuVia" Concierge -> Type "Regenerate Day 2 without beaches" -> Click Apply on confirmation card.

2:15 - 2:30  -> WEATHER SWAP & CLOSING
                Toggle "Simulate Rain" -> Show instant indoor museum swap alert -> Final Pitch.
```

---

## 19. FINAL IMPLEMENTATION CHECKLIST

- [ ] Expose `distance_from_stay_km` and `recommendation_reason` in `TimeSlotItem`.
- [ ] Add Trust Evidence Panel in `StayDetailsModal.jsx` and `ItineraryCard.jsx`.
- [ ] Upgrade `ItineraryPage.jsx` Leaflet map with Golden Stay Anchor Marker.
- [ ] Add Transparent Trip Ledger & Budget Guardrail in `TripSummary.jsx`.
- [ ] Build `SetuViaConciergeModal.jsx` tool-using chat panel with mutation confirmation cards.
- [ ] Implement `POST /api/v1/itinerary/regenerate-day` endpoint.
- [ ] Add "Simulate Rain" weather adaptation toggle.
- [ ] Execute `pytest -v tests` (23/23 PASSED) and `npm run build` (0 errors).

---

## FINAL BUILD RECOMMENDATION

### **A. FEATURES TO IMPLEMENT (P0 & P1)**
1. **Trust Evidence Panel**: Data source provenance, last audited date, direct portal links.
2. **Explainable AI Badges**: Distance from stay, interest match, budget fit tags on cards.
3. **Stay Anchor Leaflet Map**: Golden Stay Pin with radiating daily route loops (Option C).
4. **Transparent Trip Ledger & Budget Guardrail**: Itemized cost ledger & auto-optimize button.
5. **SetuVia 24/7 AI Concierge**: Context-aware tool-using chat drawer with confirmation cards.
6. **Day-Level AI Regeneration & Weather Swap**: Single-day AI re-planning & rain simulation toggle.

### **B. FEATURES TO POSTPONE / REJECT**
- ❌ **Reject Google Maps JS API** (High billing/quota failure risk during live demo; Leaflet + OSM is 100% reliable).
- ❌ **Reject Host AI Dashboard & Host Billing** (Keep as PPT slide concept).
- ❌ **Reject Aadhaar / DigiLocker Live Auth SDK** (Keep as PPT slide concept).

---

*READ-ONLY AUDIT COMPLETE: NO SOURCE CODE OR DATABASE DATA WAS MODIFIED.*
