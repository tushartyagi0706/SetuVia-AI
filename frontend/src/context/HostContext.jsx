import { createContext, useContext, useState, useEffect } from "react";
import { getHostDashboard, getHostProperty, updateHostProperty, getHostPricing, applyPricingSuggestion, generateListingContent, sendHostAssistantChat } from "../services/hostService.js";
import { useLanguage } from "./LanguageContext.jsx";

const HostContext = createContext(null);

export function HostProvider({ children }) {
  const { language } = useLanguage();
  const [dashboardData, setDashboardData] = useState(null);
  const [propertyData, setPropertyData] = useState(null);
  const [pricingData, setPricingData] = useState(null);
  const [listingDraft, setListingDraft] = useState(null);
  const [assistantMessages, setAssistantMessages] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initial fetch of host overview
    fetchDashboard();
  }, [language]);

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    try {
      const data = await getHostDashboard(language);
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load host dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function fetchProperty() {
    setLoading(true);
    setError(null);
    try {
      const data = await getHostProperty(language);
      setPropertyData(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load property details");
    } finally {
      setLoading(false);
    }
  }

  async function saveProperty(updatedProperty) {
    setLoading(true);
    setError(null);
    try {
      const result = await updateHostProperty(updatedProperty, language);
      setPropertyData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save property edits");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function fetchPricing() {
    setLoading(true);
    setError(null);
    try {
      const data = await getHostPricing(language);
      setPricingData(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pricing insights");
    } finally {
      setLoading(false);
    }
  }

  async function applyPricing(suggestionId) {
    setLoading(true);
    try {
      const result = await applyPricingSuggestion(suggestionId, language);
      setPricingData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply pricing suggestion");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function generateListing(prompt, amenities) {
    setLoading(true);
    setError(null);
    try {
      const result = await generateListingContent(prompt, amenities, language);
      setListingDraft(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI listing");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function askHostAssistant(userMessage) {
    if (!userMessage.trim()) return;
    const userMsgObj = { role: "user", text: userMessage.trim() };
    const nextMsgs = [...assistantMessages, userMsgObj];
    setAssistantMessages(nextMsgs);

    try {
      const result = await sendHostAssistantChat(userMessage, nextMsgs, language);
      const updated = [...nextMsgs, { role: "assistant", text: result.reply }];
      setAssistantMessages(updated);
      return result;
    } catch (err) {
      const errMsgs = [...nextMsgs, { role: "assistant", text: "Sorry, Host Assistant is currently offline." }];
      setAssistantMessages(errMsgs);
    }
  }

  return (
    <HostContext.Provider
      value={{
        dashboardData,
        propertyData,
        pricingData,
        listingDraft,
        assistantMessages,
        loading,
        error,
        fetchDashboard,
        fetchProperty,
        saveProperty,
        fetchPricing,
        applyPricing,
        generateListing,
        askHostAssistant,
        setListingDraft
      }}
    >
      {children}
    </HostContext.Provider>
  );
}

export function useHost() {
  const context = useContext(HostContext);
  if (!context) {
    throw new Error("useHost must be used inside HostProvider");
  }
  return context;
}
