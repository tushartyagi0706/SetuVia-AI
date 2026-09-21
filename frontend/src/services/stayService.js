/**
 * Service layer for Stay Discovery and Stay Details APIs.
 * Connects directly to FastAPI backend (/api/v1/stays).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getStays() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/stays`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stays (Status: ${response.status})`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("stayService.getStays error:", error);
    throw error;
  }
}

export async function getStayDetails(stayId) {
  if (!stayId) throw new Error("stayId is required");
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/stays/${encodeURIComponent(stayId)}`);
    if (response.status === 404) {
      throw new Error(`Stay with ID '${stayId}' was not found in verified stays.`);
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch stay details (Status: ${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error(`stayService.getStayDetails error for ${stayId}:`, error);
    throw error;
  }
}
