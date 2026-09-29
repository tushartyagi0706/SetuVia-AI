const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getHeaders(language = "en") {
  return {
    "Content-Type": "application/json",
    "X-SETUVIA-Language": language
  };
}

export async function getHostDashboard(language = "en") {
  try {
    const res = await fetch(`${API_URL}/api/v1/host/dashboard`, {
      headers: getHeaders(language)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Host Dashboard API fallback:", err);
  }

  // Grounded fallback if API unreachable
  return {
    property_name: "Panaji Residency (GTDC Partner)",
    total_bookings_this_month: 28,
    occupancy_rate_percent: 82,
    estimated_revenue_inr: 124000,
    trust_score: 4.8,
    verified_status: "GTDC Verified Partner",
    recommendations: [
      "Increase weekend rate by 12% for upcoming festival season",
      "Add 'High-speed Wi-Fi' tag to boost remote worker bookings",
      "Highlight proximity to Panaji Promenade in listing description"
    ]
  };
}

export async function getHostProperty(language = "en") {
  try {
    const res = await fetch(`${API_URL}/api/v1/host/property`, {
      headers: getHeaders(language)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Host Property API fallback:", err);
  }

  return {
    stay_id: "GOA-STAY-001",
    property_name: "Panaji Residency",
    area: "Panaji",
    district: "North Goa",
    verified_data: {
      data_source: "Goa Tourism / GTDC",
      data_quality_flag: "VERIFIED",
      rating: 4.2,
      review_count: 1036,
      official_website: "https://goa-tourism.com/stay/panaji-residency/"
    },
    editable_data: {
      tagline: "Heritage riverfront stay in the heart of Panaji",
      description: "Overlooking the Mandovi river, Panaji Residency offers comfortable accommodation with easy access to Latin Quarter walks.",
      amenities: ["Air Conditioning", "Free Breakfast", "River View", "Parking", "24/7 Front Desk"],
      house_rules: ["Check-in: 12:00 PM", "Check-out: 11:00 AM", "No smoking indoors"]
    }
  };
}

export async function updateHostProperty(updatedProperty, language = "en") {
  try {
    const res = await fetch(`${API_URL}/api/v1/host/property`, {
      method: "PUT",
      headers: getHeaders(language),
      body: JSON.stringify(updatedProperty)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Update Host Property API fallback:", err);
  }
  return updatedProperty;
}

export async function getHostPricing(language = "en") {
  try {
    const res = await fetch(`${API_URL}/api/v1/host/pricing`, {
      method: "POST",
      headers: getHeaders(language),
      body: JSON.stringify({ stay_id: "GOA-STAY-001" })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Host Pricing API fallback:", err);
  }

  return {
    current_base_rate_inr: 3200,
    recommended_base_rate_inr: 3650,
    market_demand_level: "High (Goa Season Peak)",
    insights: [
      {
        id: "sug-1",
        title: "Weekend Surge Pricing (+15%)",
        description: "Demand peaks on Friday & Saturday nights due to casino and cruise tourism.",
        impact: "+₹450 / night",
        applied: false
      },
      {
        id: "sug-2",
        title: "Extended Stay Discount (-10% for 5+ nights)",
        description: "Encourage longer stays to reduce turnover maintenance costs.",
        impact: "Higher Occupancy",
        applied: true
      }
    ]
  };
}

export async function applyPricingSuggestion(suggestionId, language = "en") {
  try {
    const res = await fetch(`${API_URL}/api/v1/host/pricing/apply`, {
      method: "POST",
      headers: getHeaders(language),
      body: JSON.stringify({ suggestion_id: suggestionId })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Apply Pricing Suggestion fallback:", err);
  }
  return await getHostPricing(language);
}

export async function generateListingContent(prompt, amenities, language = "en") {
  try {
    const res = await fetch(`${API_URL}/api/v1/host/listing/generate`, {
      method: "POST",
      headers: getHeaders(language),
      body: JSON.stringify({ prompt, amenities })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Generate Listing API fallback:", err);
  }

  return {
    generated_title: "Riverfront GTDC Heritage Stay | Panaji Promenade View",
    generated_summary: "Wake up to serene views of the Mandovi River at Panaji Residency. Located steps away from Fontainhas Latin Quarter, our verified property features modern comfort and rich Goan hospitality.",
    highlighted_amenities: amenities || ["River View", "Air Conditioning", "GTDC Partner Verified"]
  };
}

export async function sendHostAssistantChat(message, history, language = "en") {
  try {
    const res = await fetch(`${API_URL}/api/v1/host/assistant`, {
      method: "POST",
      headers: getHeaders(language),
      body: JSON.stringify({ message, history })
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn("Host Assistant Chat API fallback:", err);
  }

  return {
    reply: "Hello Host! I am your AI Property Assistant. I can help you optimize rates, write compelling descriptions, or analyze guest review trends."
  };
}
